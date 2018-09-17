// *********************************************************************************************************************
// **                                                                                                                 **
// **                  This is an example of simplistic forward rendering technique using WebGL                       **
// **                                                                                                                 **
// *********************************************************************************************************************

// ******************************************************
// **                       Data                       **
// ******************************************************

let positions = new Float32Array([
    // front
    -0.5, 0.5, 0.5,
    0.5, 0.5, 0.5,
    0.5, -0.5, 0.5,
    -0.5, -0.5, 0.5,

    // back
    -0.5, 0.5, -0.5,
    0.5, 0.5, -0.5,
    0.5, -0.5, -0.5,
    -0.5, -0.5, -0.5,

    //top
    -0.5, 0.5, 0.5,
    0.5, 0.5, 0.5,
    0.5, 0.5, -0.5,
    -0.5, 0.5, -0.5,

    //bottom
    -0.5, -0.5, 0.5,
    0.5, -0.5, 0.5,
    0.5, -0.5, -0.5,
    -0.5, -0.5, -0.5,

    //left
    -0.5, -0.5, 0.5,
    -0.5, 0.5, 0.5,
    -0.5, 0.5, -0.5,
    -0.5, -0.5, -0.5,

    //right
    0.5, -0.5, 0.5,
    0.5, 0.5, 0.5,
    0.5, 0.5, -0.5,
    0.5, -0.5, -0.5,
]);

let normals = new Float32Array([
    // front
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,

    // back
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,

    //top
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,

    //bottom
    0.0, -1.0, 0.0,
    0.0, -1.0, 0.0,
    0.0, -1.0, 0.0,
    0.0, -1.0, 0.0,

    //left
    -1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0,

    //right
    1.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
]);

let triangles = new Uint16Array([
    // front
    2, 1, 0,
    0, 3, 2,

    // back
    4, 5, 6,
    6, 7, 4,

    // top
    8, 9, 10,
    10, 11, 8,

    // bottom
    14, 13, 12,
    12, 15, 14,

    // left
    16, 17, 18,
    18, 19, 16,

    // right
    22, 21, 20,
    20, 23, 22,
]);


// ******************************************************
// **                 Pixel processing                 **
// ******************************************************

// language=GLSL
let fragmentShader = `
    #version 300 es
    precision highp float;
    
    in vec4 color;
    
    out vec4 outColor;
    
    void main()
    {
        outColor = color;
    }
`;


// ******************************************************
// **               Geometry processing                **
// ******************************************************

// language=GLSL
let vertexShader = `
    #version 300 es
    
    uniform vec4 bgColor;
    uniform vec4 fgColor;
    uniform mat4 modelViewMatrix;
    uniform mat4 modelViewProjectionMatrix;
    
    layout(location=0) in vec3 position;
    layout(location=1) in vec3 normal;
    
    out vec4 color;
    
    void main()
    {
        gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);
        vec3 viewNormal = (modelViewMatrix * vec4(normal, 0.0)).xyz;
        color = mix(bgColor * 0.8, fgColor, viewNormal.z) + pow(viewNormal.z, 10.0);
    }
`;


// ******************************************************
// **             Application processing               **
// ******************************************************

let bgColor = vec4.fromValues(1.0, 0.2, 0.3, 1.0);
let fgColor = vec4.fromValues(1.0, 0.9, 0.5, 1.0);


app.clearColor(bgColor[0], bgColor[1], bgColor[2], bgColor[3])
    // .depthTest();
    .cullBackfaces();

let program = app.createProgram(vertexShader.trim(), fragmentShader.trim());

let vertexArray = app.createVertexArray()
    .vertexAttributeBuffer(0, app.createVertexBuffer(PicoGL.FLOAT, 3, positions))
    .vertexAttributeBuffer(1, app.createVertexBuffer(PicoGL.FLOAT, 3, normals))
    .indexBuffer(app.createIndexBuffer(PicoGL.UNSIGNED_SHORT, 3, triangles));

let projMatrix = mat4.create();
let viewMatrix = mat4.create();
let viewProjMatrix = mat4.create();
let modelMatrix = mat4.create();
let modelViewMatrix = mat4.create();
let modelViewProjectionMatrix = mat4.create();
let rotateXMatrix = mat4.create();
let rotateYMatrix = mat4.create();

let drawCall = app.createDrawCall(program, vertexArray, PicoGL.TRIANGLES)
    .uniform("bgColor", bgColor)
    .uniform("fgColor", fgColor);

let startTime = new Date().getTime() / 1000;



function draw() {
    let time = new Date().getTime() / 1000 - startTime;

    mat4.perspective(projMatrix, Math.PI / 4, app.width / app.height, 0.1, 100.0);
    mat4.lookAt(viewMatrix, vec3.fromValues(3, 0, 2), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
    mat4.multiply(viewProjMatrix, projMatrix, viewMatrix);

    mat4.fromXRotation(rotateXMatrix, time * 0.1136);
    mat4.fromYRotation(rotateYMatrix, time * 0.2235);
    mat4.multiply(modelMatrix, rotateXMatrix, rotateYMatrix);

    mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
    mat4.multiply(modelViewProjectionMatrix, viewProjMatrix, modelMatrix);

    drawCall.uniform("modelViewMatrix", modelViewMatrix);
    drawCall.uniform("modelViewProjectionMatrix", modelViewProjectionMatrix);

    app.clear();
    drawCall.draw();

    // mat4.fromTranslation(modelMatrix, vec3.fromValues(0, 0, 0));
    // mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
    // mat4.multiply(modelViewProjectionMatrix, viewProjMatrix, modelMatrix);
    // drawCall.uniform("modelViewMatrix", modelViewMatrix);
    // drawCall.uniform("modelViewProjectionMatrix", modelViewProjectionMatrix);
    // drawCall.draw();

    requestAnimationFrame(draw);
}
requestAnimationFrame(draw);