# Blender script: write a reduced model as the small JSON the game reads.
#   blender -b <model.blend> -P tools/export-model.py -- <out.json> <neck x> <neck z> <normal x> <normal z>
# The model faces +X and stands on Z=0 in Blender. Faces on the far side of the neck plane become the head, which the game turns
# on its own; everything else is the body. In the file, x is the creature's left, y is up and z is forward, in units of 1/20000.
import bpy, sys, json, base64, numpy as np
out, nx0, nz0, nnx, nnz = sys.argv[sys.argv.index('--') + 1:][:5]; neck = np.array([float(nx0), 0, float(nz0)]); normal = np.array([float(nnx), 0, float(nnz)])
ob = [o for o in bpy.context.scene.objects if o.type == 'MESH'][0]; me = ob.data
co = np.empty(len(me.vertices) * 3, dtype=np.float32); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
tri = np.empty(len(me.polygons) * 3, dtype=np.int32); me.loops.foreach_get('vertex_index', tri); tri = tri.reshape(-1, 3)
rgba = np.empty(len(me.loops) * 4, dtype=np.float32); me.color_attributes['face'].data.foreach_get('color_srgb', rgba); rgb = rgba.reshape(-1, 3, 4)[:, 0, :3]
pts = co[tri]                                    # faces x 3 corners x (x, y, z)
head = ((pts.mean(axis=1) - neck) @ normal) > 0
def part(mask):
    p = pts[mask][:, :, [1, 2, 0]]               # Blender (forward, left, up) -> game (left, up, forward)
    return {'p': base64.b64encode(np.round(p * 20000).astype('<i2').tobytes()).decode(), 'c': base64.b64encode(np.round(np.clip(rgb[mask], 0, 1) * 255).astype(np.uint8).tobytes()).decode(), 'faces': int(mask.sum())}
data = {'unit': 20000, 'body': part(~head), 'head': part(head), 'pivot': [0, float(neck[2]), float(neck[0])]}
json.dump(data, open(out, 'w'))
print('EXPORT body', data['body']['faces'], 'head', data['head']['faces'], 'bytes', len(json.dumps(data)))
