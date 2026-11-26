import bpy, os
from . import core

def export_glb(path, objs=None, quality=82):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    objs = objs or core.mesh_objects()
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=path, export_format='GLB', use_selection=True, export_apply=True,
        export_image_format='WEBP', export_image_quality=quality,
        export_draco_mesh_compression_enable=os.environ.get('HD_NO_DRACO') != '1', export_draco_mesh_compression_level=6,
        export_draco_position_quantization=14, export_draco_normal_quantization=10, export_draco_texcoord_quantization=12,
        export_yup=True, export_animations=True, export_cameras=False, export_lights=False,
    )
    return os.path.getsize(path)
