"""Connectivity check: every mesh part must touch (≤ tol) a chain of parts that reaches the ground.
Uses real surface proximity (BVH overlap + nearest-point on sampled vertices), not just boxes,
so a rounded cushion hovering over leg tips is caught."""
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

def _world_mesh(o, dg):
    ev = o.evaluated_get(dg)
    me = ev.to_mesh()
    mw = ev.matrix_world
    verts = [mw @ v.co for v in me.vertices]
    polys = [tuple(p.vertices) for p in me.polygons]
    ev.to_mesh_clear()
    return verts, polys

def connectivity(objs, tol=0.012, ground_tol=0.012, samples=600):
    dg = bpy.context.evaluated_depsgraph_get()
    parts = []
    for o in objs:
        if o.type != 'MESH':
            continue
        verts, polys = _world_mesh(o, dg)
        if not verts:
            continue
        mn = Vector((min(v.x for v in verts), min(v.y for v in verts), min(v.z for v in verts)))
        mx = Vector((max(v.x for v in verts), max(v.y for v in verts), max(v.z for v in verts)))
        step = max(1, len(verts) // samples)
        parts.append(dict(name=o.name, verts=verts[::step], bvh=BVHTree.FromPolygons(verts, polys) if polys else None, mn=mn, mx=mx))
    n = len(parts)
    groundz = min(p['mn'].z for p in parts) if parts else 0
    adj = [set() for _ in range(n)]
    def near(a, b):
        if any(a['mn'][k] - tol > b['mx'][k] or b['mn'][k] - tol > a['mx'][k] for k in range(3)):
            return False
        if a['bvh'] and b['bvh'] and a['bvh'].overlap(b['bvh']):
            return True
        for x, y in ((a, b), (b, a)):
            if not y['bvh']:
                continue
            for v in x['verts']:
                hit = y['bvh'].find_nearest(v, tol)
                if hit[0] is not None:
                    return True
        return False
    def inside(a, b):
        """a's first vertex lies inside closed mesh b (odd ray-crossing count) and a's box is within b's box."""
        if not b['bvh'] or any(a['mn'][k] < b['mn'][k] - tol or a['mx'][k] > b['mx'][k] + tol for k in range(3)):
            return False
        o = a['verts'][0].copy()
        d = Vector((0.0123, 0.0071, 1.0)).normalized()
        hits = 0
        for _ in range(64):
            loc, nrm, idx, dist = b['bvh'].ray_cast(o, d)
            if loc is None:
                break
            hits += 1
            o = loc + d * 1e-5
        return hits % 2 == 1
    for i in range(n):
        for j in range(i + 1, n):
            if near(parts[i], parts[j]) or inside(parts[i], parts[j]) or inside(parts[j], parts[i]):
                adj[i].add(j); adj[j].add(i)
    seen = set(i for i, p in enumerate(parts) if p['mn'].z - groundz <= ground_tol)
    stack = list(seen)
    while stack:
        i = stack.pop()
        for j in adj[i]:
            if j not in seen:
                seen.add(j); stack.append(j)
    return [parts[i]['name'] for i in range(n) if i not in seen]
