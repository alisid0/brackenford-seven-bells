# Blender script: write a rigged, retopologised model (GLB with a skeleton, as Tripo exports it) as the JSON the game reads.
#   blender -b -P tools/export-rigged.py -- <in.glb> <out.json> [preview.png]
# The model faces +X and stands on Z in Blender. In the file x is the creature's left, y is up and z is forward,
# the creature is one unit tall and stands on y=0. Each face has one flat colour taken from the texture.
# Every corner carries up to four bones and their weights. Bones are plain points (their heads) with a parent:
# the game builds them with no rest rotation, so turning a bone about x pitches it, about y yaws it, about z rolls it.
import bpy, sys, json, base64, numpy as np
args = sys.argv[sys.argv.index('--') + 1:]; src, out = args[0], args[1]
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=src)
arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
ob = next(o for o in bpy.context.scene.objects if o.type == 'MESH' and o.parent == arm)
me = ob.data; mw = np.array(ob.matrix_world); aw = np.array(arm.matrix_world)
co = np.empty(len(me.vertices) * 3, dtype=np.float32); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
co = co @ mw[:3, :3].T + mw[:3, 3]
lo, hi = co.min(axis=0), co.max(axis=0); scale = 1 / (hi[2] - lo[2]); shift = np.array([(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, lo[2]])
fix = lambda p: ((np.asarray(p) - shift) * scale)[..., [1, 2, 0]]          # centre, stand on the ground, one unit tall, game axes
me.calc_loop_triangles(); tri = np.empty(len(me.loop_triangles) * 3, dtype=np.int32); me.loop_triangles.foreach_get('vertices', tri)
loops = np.empty(len(me.loop_triangles) * 3, dtype=np.int32); me.loop_triangles.foreach_get('loops', loops)
# one flat colour per face, from the texture where the middle of the face lies
img = next(i for i in bpy.data.images if 'basecolor' in i.name.lower()) if any('basecolor' in i.name.lower() for i in bpy.data.images) else max(bpy.data.images, key=lambda i: i.size[0] * i.size[1])
img.scale(1024, 1024); w, h = img.size; px = np.empty(w * h * 4, dtype=np.float32); img.pixels.foreach_get(px); px = px.reshape(h, w, 4)
uv = np.empty(len(me.loops) * 2, dtype=np.float32); me.uv_layers.active.data.foreach_get('uv', uv); uv = uv.reshape(-1, 2)[loops].reshape(-1, 3, 2).mean(axis=1)
rgb = px[np.clip((uv[:, 1] % 1 * h).astype(int), 0, h - 1), np.clip((uv[:, 0] % 1 * w).astype(int), 0, w - 1), :3]
# bones and weights
bones = list(arm.data.bones); index = {b.name: i for i, b in enumerate(bones)}
group_bone = {g.index: index[g.name] for g in ob.vertex_groups if g.name in index}
skin_i = np.zeros((len(me.vertices), 4), dtype=np.uint8); skin_w = np.zeros((len(me.vertices), 4), dtype=np.float32)
for v in me.vertices:
    top = sorted(((g.weight, group_bone[g.group]) for g in v.groups if g.group in group_bone and g.weight > 0), reverse=True)[:4]
    if not top: top = [(1.0, 0)]
    total = sum(t[0] for t in top)
    for k, (wt, bi) in enumerate(top): skin_i[v.index, k] = bi; skin_w[v.index, k] = wt / total
b64 = lambda a: base64.b64encode(a.tobytes()).decode()
short = lambda n: n.replace('tripo::', '')
data = {
    'unit': 20000, 'faces': int(len(tri) // 3),
    'p': b64(np.round(fix(co)[tri] * 20000).astype('<i2')),
    'c': b64(np.round(np.clip(rgb, 0, 1) * 255).astype(np.uint8)),
    'si': b64(skin_i[tri]), 'sw': b64(np.round(skin_w[tri] * 255).astype(np.uint8)),
    'bones': [{'name': short(b.name), 'parent': index[b.parent.name] if b.parent else -1,
               'head': [round(float(v), 5) for v in fix(aw[:3, :3] @ np.array(b.head_local) + aw[:3, 3])],
               'tail': [round(float(v), 5) for v in fix(aw[:3, :3] @ np.array(b.tail_local) + aw[:3, 3])]} for b in bones]}
json.dump(data, open(out, 'w'))
print('RIGGED faces', data['faces'], 'bones', len(bones), 'bytes', len(json.dumps(data)))
for b in data['bones']: print('  BONE', b['name'], 'parent', b['parent'], 'head', [round(v, 3) for v in b['head']])
# where the red of the eyes is: the brightest pure-red faces near the head
c = fix(co)[tri].reshape(-1, 3, 3).mean(axis=1); red = (rgb[:, 0] > .75) & (rgb[:, 1] < .3) & (rgb[:, 2] < .3) & (c[:, 1] > .5) & (c[:, 2] > .15)
for side in (-1, 1):
    m = red & (c[:, 0] * side > 0)
    if m.any(): print('  EYE side', side, [round(float(v), 3) for v in c[m].mean(axis=0)], 'faces', int(m.sum()))
