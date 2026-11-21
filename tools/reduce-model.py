# Blender script: reduce a text-to-3D model to game size and paint each face with one flat colour taken from its texture.
#   blender -b -P tools/reduce-model.py -- <in.glb> <out.blend> <faces> <preview-prefix>
import bpy, sys, math, numpy as np
from mathutils import Vector
src, out, faces, prefix = sys.argv[sys.argv.index('--') + 1:][:4]; faces = int(faces)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in meshes: o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1: bpy.ops.object.join()
ob = bpy.context.view_layer.objects.active
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
me = ob.data
print('REDUCE start faces', len(me.polygons))
mod = ob.modifiers.new('d', 'DECIMATE'); mod.ratio = min(1, faces / max(1, len(me.polygons)))
bpy.ops.object.modifier_apply(modifier='d')
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.quads_convert_to_tris(); bpy.ops.object.mode_set(mode='OBJECT')
me = ob.data
# the colour of each face: its texture sampled where the middle of the face lies
img = max(bpy.data.images, key=lambda i: i.size[0] * i.size[1])
img.scale(1024, 1024); w, h = img.size
px = np.empty(w * h * 4, dtype=np.float32); img.pixels.foreach_get(px); px = px.reshape(h, w, 4)
uv = np.empty(len(me.loops) * 2, dtype=np.float32); me.uv_layers.active.data.foreach_get('uv', uv); uv = uv.reshape(-1, 3, 2).mean(axis=1)
x = np.clip((uv[:, 0] % 1 * w).astype(int), 0, w - 1); y = np.clip((uv[:, 1] % 1 * h).astype(int), 0, h - 1)
face_rgb = px[y, x, :3]
col = me.color_attributes.new('face', 'BYTE_COLOR', 'CORNER')
rgba = np.ones((len(me.polygons), 3, 4), dtype=np.float32); rgba[:, :, :3] = face_rgb[:, None, :]
col.data.foreach_set('color_srgb', rgba.reshape(-1))
me.color_attributes.active_color = col
# stand it on the ground, centred, one unit tall
co = np.empty(len(me.vertices) * 3, dtype=np.float32); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
lo, hi = co.min(axis=0), co.max(axis=0); scale = 1 / (hi[2] - lo[2])
co = (co - [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, lo[2]]) * scale
me.vertices.foreach_set('co', co.reshape(-1)); me.update()
lo, hi = co.min(axis=0), co.max(axis=0)
print('REDUCE done faces', len(me.polygons), 'size', [round(float(v), 3) for v in hi - lo], 'image', img.name)
bpy.ops.wm.save_as_mainfile(filepath=out)
# previews from four sides and above, flat colours only
sc = bpy.context.scene; sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.light = 'FLAT'; sc.display.shading.color_type = 'VERTEX'
sc.render.resolution_x = sc.render.resolution_y = 420; sc.render.film_transparent = False
world = bpy.data.worlds.new('w'); sc.world = world; world.color = (.25, .27, .3)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam; cam.data.type = 'ORTHO'; cam.data.ortho_scale = 1.7
for name, pos in [('front', (0, -4, .5)), ('back', (0, 4, .5)), ('right', (4, 0, .5)), ('left', (-4, 0, .5)), ('top', (0, 0, 4.5))]:
    cam.location = pos; d = Vector((0, 0, .5)) - Vector(pos); cam.rotation_euler = d.to_track_quat('-Z', 'Y' if name == 'top' else 'Z').to_euler()
    sc.render.filepath = prefix + name + '.png'; bpy.ops.render.render(write_still=True)
