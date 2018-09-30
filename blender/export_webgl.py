# Blender addon for WebGL arrays export
# To install open Blender, File -> User Preferences -> Add-ons -> Install Add-on from file -> Choose this file -> Save user settings
# To export select object in Scene view, File -> Export -> WebGL arrays

bl_info = {
    "name": "ExportWebGL",
    "category": "Object",
}

import bpy
from bpy_extras.io_utils import ExportHelper
from bpy.props import StringProperty, BoolProperty, IntProperty, FloatProperty, EnumProperty

flatten = lambda l: [item for sublist in l for item in sublist]

def polygon_to_tris(vertices):
    for i in range(1, len(vertices) - 1):
        yield vertices[0]
        yield vertices[i]
        yield vertices[i + 1]

class ExportWebGL(bpy.types.Operator, ExportHelper):
    """Export to WebGL arrays"""            # blender will use this as a tooltip for menu items and buttons.
    bl_idname = "object.exportwebgl"        # unique identifier for buttons and menu items to reference.
    bl_label = "Export to WebGL arrays"     # display name in the interface.

    # ExportHelper mixin class uses this
    filename_ext = ".js"
    filter_glob = StringProperty(default="*.js", options={'HIDDEN'})

    opt_FloatDecimals = IntProperty(name="Number of decimals on floats", description="Number of decimals on floats", default=4)
    opt_Scale = FloatProperty(name="Scale", description="Scale", default=1.0)

    @classmethod
    def poll(cls, context):
        return context.active_object != None

    def export_as_webgl_arrays(self, path):
        bpy.ops.object.mode_set(mode='OBJECT')

        object = bpy.context.object
        object.data.calc_normals_split()

        vertices = []
        normals = []
        uvs = []

        loop_index = 0
        for l in object.data.loops:
            vertices.append(object.data.vertices[l.vertex_index].co)
            normals.append(l.normal)
            if object.data.uv_layers.active and len(object.data.uv_layers.active.data) > 0:
                uvs.append(object.data.uv_layers.active.data[loop_index].uv)
            loop_index = loop_index + 1

        vertices = flatten([list(v) for v in vertices])
        normals = flatten([list(n) for n in normals])
        uvs = flatten([list(v) for v in uvs])
        indices = flatten([polygon_to_tris(list(p.loop_indices)) for p in object.data.polygons])

        float_format = "{:." + str(self.opt_FloatDecimals) + "f}"
        with open(path, 'w') as f:
            f.write("// " + object.name + "\n")
            f.write("var {0}_vertices = [ {1} ];\n".format(
                object.name, ",".join([float_format.format(v * self.opt_Scale) for v in vertices])))
            f.write("var {0}_normals = [ {1} ];\n".format(
                object.name, ",".join([float_format.format(n * self.opt_Scale) for n in normals])))
            f.write("var {0}_uvs = [ {1} ];\n".format(
                object.name, ",".join([float_format.format(n) for n in uvs])))
            f.write("var {0}_indices = [ {1} ];\n".format(
                object.name, ",".join([str(i) for i in indices])))

    def execute(self, context):
        self.export_as_webgl_arrays(self.filepath)

        return {'FINISHED'}

def menu_func(self, context):
    self.layout.operator(ExportWebGL.bl_idname, text="WebGL arrays (.js)...")

def register():
    bpy.utils.register_class(ExportWebGL)
    bpy.types.INFO_MT_file_export.append(menu_func)

def unregister():
    bpy.utils.unregister_class(ExportWebGL)
    bpy.types.INFO_MT_file_export.remove(menu_func_export)

if __name__ == "__main__":
    register()