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

    opt_MergeVertexNormal = BoolProperty(name="Merge vertex and normal arrays", description="Merge vertex and normal arrays", default=False)
    opt_FloatDecimals = IntProperty(name="Number of decimals on floats", description="Number of decimals on floats", default=4)
    opt_Scale = FloatProperty(name="Scale", description="Scale", default=1.0)

    @classmethod
    def poll(cls, context):
        return context.active_object != None

    def export_as_webgl_arrays(self, obj, path):
        bpy.ops.object.mode_set(mode='OBJECT')

        obj = bpy.context.object
        data = obj.data
        tris = data.polygons

        if self.opt_MergeVertexNormal:
            vertices = [list(v.co) for v in data.vertices]
            normals = [list(v.normal) for v in data.vertices]
            vertexnormals = flatten([val for pair in zip(vertices, normals) for val in pair])
        else:
            vertices = flatten([list(v.co) for v in data.vertices])
            normals = flatten([list(v.normal) for v in data.vertices])

        indices = flatten([polygon_to_tris(list(face.vertices)) for face in data.polygons])

        float_format = "{:." + str(self.opt_FloatDecimals) + "f}"
        with open(path, 'w') as f:
            f.write("// " + obj.name + "\n")
            if self.opt_MergeVertexNormal:
                f.write("var {0}_array = [ {1} ];\n".format(
                    obj.name, ",".join([float_format.format(v * self.opt_Scale) for v in vertexnormals])))
            else:
                f.write("var {0}_vertices = [ {1} ];\n".format(
                    obj.name, ",".join([float_format.format(v * self.opt_Scale) for v in vertices])))
                f.write("var {0}_normals = [ {1} ];\n".format(
                    obj.name, ",".join([float_format.format(n * self.opt_Scale) for n in normals])))

            if data.uv_layers.active is not None:
                uvs = [None] * len(data.vertices)
                index = 0
                for p in data.polygons:
                    for v in p.vertices:
                        uvs[v] = data.uv_layers.active.data[index].uv
                        index = index + 1

                uvs = flatten([list(v) for v in uvs])
                f.write("var {0}_uvs = [ {1} ];\n".format(
                    obj.name, ",".join([float_format.format(n) for n in uvs])))

            f.write("var {0}_indices = [ {1} ];\n".format(
                obj.name, ",".join([str(i) for i in indices])))

    def execute(self, context):
        obj = bpy.context.object
        self.export_as_webgl_arrays(obj, self.filepath)

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