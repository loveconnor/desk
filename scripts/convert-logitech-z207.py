"""Convert Flareworks Studio's free BlenderKit Z207 asset for the desk scene.
Run: Blender -b --disable-autoexec --python scripts/convert-logitech-z207.py -- SOURCE.blend OUTPUT.glb
See public/models/logitech-z207/README.md for source and license.
"""
import bpy, sys, math, json
from mathutils import Matrix, Vector
source, destination = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.open_mainfile(filepath=source)
# glTF cannot carry Blender's procedural/mixed shaders. Retain the supplied
# logo/control mask and UV mapping; approximate sub-pixel plastic grain by roughness.
for m in bpy.data.materials:
    if not m.node_tree: continue
    old = m.node_tree
    logo = old.nodes.get('Image Texture') if m.name.startswith('Plástico fosco 1') else None
    logo_image = logo.image if logo else None
    logo_output = None
    if logo:
        logo_output = next((l.from_socket.name for l in old.links if l.from_node == logo and l.to_node.type == 'MIX_SHADER'), 'Color')
    woofer = old.nodes.get('Principled BSDF') if m.name == 'woofer' else None
    woofer_color = tuple(woofer.inputs['Base Color'].default_value) if woofer else None
    old.nodes.clear()
    out = old.nodes.new('ShaderNodeOutputMaterial')
    p = old.nodes.new('ShaderNodeBsdfPrincipled')
    old.links.new(p.outputs['BSDF'], out.inputs['Surface'])
    p.inputs['Base Color'].default_value = woofer_color or ((.045,.05,.051,1) if m.name == 'Plástico fosco cinza' else (.012,.014,.016,1))
    p.inputs['Roughness'].default_value = .74 if m.name in ['woofer','leather','Borracha'] else .52
    if m.name in ['Assorted Screw Profiles','Metal Aluminio preto']: p.inputs['Metallic'].default_value = .55
    if logo_image:
        # Bake only the simple two-color logo mix into its existing image layout.
        # This avoids runtime shader extensions and preserves the model's UVs.
        import numpy as np
        copy = logo_image.copy()
        if copy.size[0] > 512: copy.scale(512, round(copy.size[1] * 512 / copy.size[0]))
        width, height = copy.size
        data = np.empty(width * height * 4, dtype=np.float32)
        copy.pixels.foreach_get(data)
        data = data.reshape((-1,4))
        factor = data[:,3:4] if logo_output == 'Alpha' else data[:,:3].mean(axis=1,keepdims=True)
        padded = np.zeros((height * 3, width * 3, 1), dtype=np.float32)
        padded[height:height*2,width:width*2] = factor.reshape((height,width,1))
        factor = padded.reshape((-1,1))
        width *= 3; height *= 3
        colors = np.array([.012,.014,.016]) * (1-factor) + np.array([.72,.74,.73]) * factor
        pixels = np.concatenate((colors, np.ones((len(factor),1))),axis=1).astype(np.float32)
        image = bpy.data.images.new(m.name + ' baked logo', width=width, height=height, alpha=False)
        image.pixels.foreach_set(pixels.ravel()); image.pack()
        if width > 1024: image.scale(1024, round(height * 1024 / width))
        image.pack()
        texture = old.nodes.new('ShaderNodeTexImage'); texture.image = image
        texture.extension = 'EXTEND'  # Source uses CLIP; transparent border was baked to black.
        old.links.new(texture.outputs['Color'],p.inputs['Base Color'])
        print('LOGO',m.name,logo_image.name,logo_output)
# Evaluate the source objects, preserving the existing topology/UVs but limiting
# subdivision to the artist's working resolution. Cables are routed in scene.
roots = [bpy.data.objects['Cube'], bpy.data.objects['Cube.005']]
rot = Matrix.Rotation(math.pi / 2, 4, 'Z')
converted = []
for root, name in zip(roots,['LeftSpeaker','RightSpeaker']):
    members = [root] + list(root.children_recursive)
    yaw = root.matrix_world.to_euler().z - roots[1].matrix_world.to_euler().z
    orient = rot @ Matrix.Rotation(-yaw, 4, 'Z')
    for o in members:
        for mod in o.modifiers:
            if mod.type == 'SUBSURF': mod.levels = min(mod.levels, 1); mod.render_levels = mod.levels
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    parts = []
    for o in members:
        if o.type != 'MESH' or o.name.startswith('Screws'): continue
        mesh = bpy.data.meshes.new_from_object(o.evaluated_get(depsgraph), depsgraph=depsgraph)
        mesh.transform(orient @ o.matrix_world)
        mesh.validate(); mesh.update()
        if any(m and m.name.startswith('Plástico fosco 1') for m in mesh.materials):
            uv = mesh.uv_layers.get('UVMap')
            if uv:
                for loop in uv.data: loop.uv = (loop.uv + Vector((1,1))) / 3
        obj = bpy.data.objects.new(name + '_' + o.name, mesh)
        parts.append(obj)
    coords = [v.co for o in parts for v in o.data.vertices]
    low = Vector(tuple(min(v[i] for v in coords) for i in range(3)))
    high = Vector(tuple(max(v[i] for v in coords) for i in range(3)))
    center = (low+high)/2; center.z = low.z
    scale = .241/(high.z-low.z)
    parent = bpy.data.objects.new(name,None)
    bpy.context.scene.collection.objects.link(parent)
    for obj in parts:
        obj.data.transform(Matrix.Scale(scale,4) @ Matrix.Translation(-center))
        bpy.context.scene.collection.objects.link(obj); obj.parent = parent
        obj.data.calc_loop_triangles()
        triangles = len(obj.data.loop_triangles)
        if triangles > 4000 and not any(m and m.name.startswith('Plástico fosco 1') for m in obj.data.materials):
            modifier = obj.modifiers.new('Web mesh reduction', 'DECIMATE')
            modifier.ratio = 4000 / triangles
            bpy.context.view_layer.objects.active = obj
            obj.select_set(True)
            bpy.ops.object.modifier_apply(modifier=modifier.name)
            obj.select_set(False)
        converted.append(obj)
    converted.append(parent)
    print('SATELLITE',name,'dimensions meters',list((high-low)*scale))
# Remove source objects so only the normalized pair enters the GLB.
for obj in list(bpy.data.objects):
    if obj not in converted: bpy.data.objects.remove(obj,do_unlink=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=destination,export_format='GLB',use_selection=True,export_yup=True,export_extras=False)
print('EXPORTED',destination)
