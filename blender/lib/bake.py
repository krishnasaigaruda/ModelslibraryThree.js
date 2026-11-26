"""Bake procedural materials into image textures (color+AO, roughness, normal) and
swap in glTF-friendly materials. One mesh object per material after this step."""
import bpy, json, os, tempfile
from . import core

TMP = os.path.join(tempfile.gettempdir(), 'three-premade-hd-bake')
os.makedirs(TMP, exist_ok=True)

def split_by_material(objs):
    """Apply modifiers + transforms, separate by material, then join per material."""
    meshes = [o for o in objs if o.type == 'MESH']
    for o in meshes:
        core.apply_mods(o)
    core.apply_transform(meshes)
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes:
        if len(o.data.materials) > 1:
            bpy.context.view_layer.objects.active = o
            o.select_set(True)
            bpy.ops.object.mode_set(mode='EDIT')
            bpy.ops.mesh.select_all(action='SELECT')
            bpy.ops.mesh.separate(type='MATERIAL')
            bpy.ops.object.mode_set(mode='OBJECT')
            bpy.ops.object.select_all(action='DESELECT')
    groups = {}
    for o in core.mesh_objects():
        if not o.data.materials or o.data.materials[0] is None:
            continue
        groups.setdefault(o.data.materials[0].name, []).append(o)
    out = []
    for name, os_ in groups.items():
        j = core.join(os_, name)
        # drop unused slots
        while len(j.data.materials) > 1:
            j.data.materials.pop(index=len(j.data.materials) - 1)
        out.append(j)
    return out

def _img(name, res, data):
    im = bpy.data.images.new(name, res, res, alpha=False, float_buffer=False)
    im.colorspace_settings.name = 'sRGB' if data == 'color' else 'Non-Color'
    return im

def _emit_bake(obj, m, socket_from, res, name, samples, data):
    nt = m.node_tree
    out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
    bsdf_link = out.inputs['Surface'].links[0].from_socket
    em = nt.nodes.new('ShaderNodeEmission')
    if isinstance(socket_from, (int, float)):
        em.inputs['Color'].default_value = (socket_from,) * 3 + (1,)
    else:
        nt.links.new(socket_from, em.inputs['Color'])
    nt.links.new(em.outputs[0], out.inputs['Surface'])
    im = _img(f'{obj.name}_{name}', res, data)
    tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = im
    nt.nodes.active = tex
    bpy.context.scene.cycles.samples = samples
    bpy.ops.object.bake(type='EMIT', margin=8, use_clear=True)
    nt.links.new(bsdf_link, out.inputs['Surface'])
    nt.nodes.remove(em); nt.nodes.remove(tex)
    return im

def _normal_bake(obj, m, res):
    nt = m.node_tree
    im = _img(f'{obj.name}_normal', res, 'normal')
    tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = im
    nt.nodes.active = tex
    bpy.context.scene.cycles.samples = 4
    bpy.ops.object.bake(type='NORMAL', normal_space='TANGENT', margin=8, use_clear=True)
    nt.nodes.remove(tex)
    return im

def _save(im):
    path = os.path.join(TMP, f'{im.name}.png')
    im.filepath_raw = path
    im.file_format = 'PNG'
    im.save()
    return im

def bake_object(obj, res=1024, ao=0.65, samples=12):
    m = obj.data.materials[0]
    spec = json.loads(m.get('spec', '{}'))
    if not spec.get('bake'):
        return
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    # UVs
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.004, area_weight=0.0, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    nt = m.node_tree
    bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    bc = bsdf.inputs['Base Color']
    col_src = bc.links[0].from_socket if bc.links else None
    # color × AO
    if col_src is not None and ao > 0:
        aon = nt.nodes.new('ShaderNodeAmbientOcclusion')
        aon.samples = 8
        aon.inputs['Distance'].default_value = spec.get('ao_dist', 0.12)
        mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'
        mix.inputs[0].default_value = ao
        nt.links.new(col_src, mix.inputs[6])
        nt.links.new(aon.outputs['AO'], mix.inputs[7])
        col_src = mix.outputs[2]
    col = _emit_bake(obj, m, col_src if col_src is not None else 1.0, res, 'color', samples, 'color')
    rr = bsdf.inputs['Roughness']
    rough = _emit_bake(obj, m, rr.links[0].from_socket if rr.links else rr.default_value, max(256, res // 2), 'rough', 1, 'data')
    nrm = _normal_bake(obj, m, res) if bsdf.inputs['Normal'].links else None
    for im in (col, rough, nrm):
        if im: _save(im)
    # ---- replace with a glTF-friendly material
    name = m.name
    m.name = name + '__proc'
    nm = bpy.data.materials.new(name)
    nm.use_nodes = True
    t = nm.node_tree
    b = next(n for n in t.nodes if n.type == 'BSDF_PRINCIPLED')
    tc = t.nodes.new('ShaderNodeTexImage'); tc.image = col
    if spec.get('tint') and 'factor' in spec:
        mul = t.nodes.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'
        mul.inputs[0].default_value = 1.0
        t.links.new(tc.outputs['Color'], mul.inputs[6])
        mul.inputs[7].default_value = (*spec['factor'], 1)
        t.links.new(mul.outputs[2], b.inputs['Base Color'])
    else:
        t.links.new(tc.outputs['Color'], b.inputs['Base Color'])
    tr = t.nodes.new('ShaderNodeTexImage'); tr.image = rough
    t.links.new(tr.outputs['Color'], b.inputs['Roughness'])
    if nrm:
        tn = t.nodes.new('ShaderNodeTexImage'); tn.image = nrm
        nmap = t.nodes.new('ShaderNodeNormalMap')
        nmap.inputs['Strength'].default_value = spec.get('normal_strength', 1.0)
        t.links.new(tn.outputs['Color'], nmap.inputs['Color'])
        t.links.new(nmap.outputs['Normal'], b.inputs['Normal'])
    b.inputs['Metallic'].default_value = spec.get('metal', 0.0)
    if spec.get('sheen'):
        b.inputs['Sheen Weight'].default_value = spec['sheen']
        b.inputs['Sheen Roughness'].default_value = 0.6
    if spec.get('emit'):
        from .mats import hexrgb
        b.inputs['Emission Color'].default_value = (*hexrgb(spec['emit']), 1)
        b.inputs['Emission Strength'].default_value = spec.get('strength', 0.5)
    obj.data.materials[0] = nm

def auto_res(obj, big=1024, small=512):
    d = max(obj.dimensions)
    return big if d > 0.6 else small

def bake_all(objs=None, res=None, max_res=1024):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.render.bake.target = 'IMAGE_TEXTURES'
    sc.cycles.use_denoising = False
    objs = split_by_material(objs or core.mesh_objects())
    for o in objs:
        r = min(max_res, res or auto_res(o))
        spec = json.loads(o.data.materials[0].get('spec', '{}'))
        r = min(r, spec.get('res', r))
        bake_object(o, r)
    return objs
