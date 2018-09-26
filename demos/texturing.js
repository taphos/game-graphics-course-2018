
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

let uvs = new Float32Array([
    // front
    0.0, 1.0,
    1.0, 1.0,
    1.0, 0.0,
    0.0, 0.0,

    // back
    0.0, 1.0,
    1.0, 1.0,
    1.0, 0.0,
    0.0, 0.0,

    //top
    0.0, 1.0,
    1.0, 1.0,
    1.0, 0.0,
    0.0, 0.0,

    //bottom
    0.0, 1.0,
    1.0, 1.0,
    1.0, 0.0,
    0.0, 0.0,

    //left
    0.0, 1.0,
    1.0, 1.0,
    1.0, 0.0,
    0.0, 0.0,

    //right
    0.0, 1.0,
    1.0, 1.0,
    1.0, 0.0,
    0.0, 0.0,
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


// language=GLSL
let fragmentShader = `
    #version 300 es
    precision highp float;
    
    uniform sampler2D tex;
    uniform float time;
    
    in vec2 uv;
    
    out vec4 outColor;
    
    void main()
    {        
        outColor = texture(tex, (uv - vec2(0.5, 0.5)) * time) + texture(tex, uv * 2.0);
    }
`;

// language=GLSL
let vertexShader = `
    #version 300 es
            
    uniform mat4 modelViewProjectionMatrix;
    
    layout(location=0) in vec3 position;
    layout(location=1) in vec3 normal;
    layout(location=2) in vec2 inUv;
        
    out vec2 uv;
    
    void main()
    {
        gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);           
        uv = inUv;
    }
`;


// language=GLSL
let skyboxVertexShader = `
    #version 300 es

    layout(std140, column_major) uniform;
    layout(location=0) in vec4 position;
    
    uniform mat4 viewProjectionMatrix;    
    
    out vec3 vPosition;
    
    void main() {
        vec4 worldPosition = vec4(position.xyz * 5.0, 1.0);
        vPosition = position.xyz;
        gl_Position = viewProjectionMatrix * worldPosition;
    }
`;

// language=GLSL
let skyboxFragmentShader = `
    #version 300 es
    precision highp float;
    
    uniform samplerCube cubemap;
    
    in vec3 vPosition;
    out vec4 fragColor;
    
    void main() {
        vec3 color = texture(cubemap, vPosition).rgb;
        fragColor = vec4(color, 1.0);
    }
`;


app
 //.depthTest()
    .cullBackfaces();

let program = app.createProgram(vertexShader.trim(), fragmentShader.trim());
let skyboxProgram = app.createProgram(skyboxVertexShader.trim(), skyboxFragmentShader.trim());

let vertexArray = app.createVertexArray()
    .vertexAttributeBuffer(0, app.createVertexBuffer(PicoGL.FLOAT, 3, positions))
    .vertexAttributeBuffer(1, app.createVertexBuffer(PicoGL.FLOAT, 3, normals))
    .vertexAttributeBuffer(2, app.createVertexBuffer(PicoGL.FLOAT, 2, uvs))
    .indexBuffer(app.createIndexBuffer(PicoGL.UNSIGNED_SHORT, 3, triangles));

let projMatrix = mat4.create();
let viewMatrix = mat4.create();
let viewProjMatrix = mat4.create();
let modelMatrix = mat4.create();
let modelViewMatrix = mat4.create();
let modelViewProjectionMatrix = mat4.create();
let rotateXMatrix = mat4.create();
let rotateYMatrix = mat4.create();

loadImages(["images/texture.jpg", "images/sky-negx.png", "images/sky-posx.png", "images/sky-negy.png", "images/sky-posy.png", "images/sky-negz.png", "images/sky-posz.png"], function (images) {
    let drawCall = app.createDrawCall(program, vertexArray, PicoGL.TRIANGLES)
        .texture("tex", app.createTexture2D(images[0], images[0].width, images[0].height, {wrapS: PicoGL.MIRRORED_REPEAT, wrapT: PicoGL.MIRRORED_REPEAT}));

    let skyboxDrawCall = app.createDrawCall(skyboxProgram, vertexArray)
        .texture("cubemap", app.createCubemap({
            negX: images[1],
            posX: images[2],
            negY: images[3],
            posY: images[4],
            negZ: images[5],
            posZ: images[6],
            flipY: false
        }));

    let startTime = new Date().getTime() / 1000;


    function draw() {
        let time = new Date().getTime() / 1000 - startTime;

        mat4.perspective(projMatrix, Math.PI / 4, app.width / app.height, 0.1, 100.0);
        let camPos = vec3.rotateY(vec3.create(), vec3.fromValues(3, 0, 2), vec3.fromValues(0, 0, 0), time * 0.05);
        mat4.lookAt(viewMatrix, camPos, vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
        mat4.multiply(viewProjMatrix, projMatrix, viewMatrix);

        mat4.fromXRotation(rotateXMatrix, time * 0.1136);
        mat4.fromYRotation(rotateYMatrix, time * 0.2235);
        mat4.multiply(modelMatrix, rotateXMatrix, rotateYMatrix);

        mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
        mat4.multiply(modelViewProjectionMatrix, viewProjMatrix, modelMatrix);

        app.clear();

        skyboxDrawCall.uniform("viewProjectionMatrix", viewProjMatrix);
        skyboxDrawCall.draw();

        drawCall.uniform("modelViewProjectionMatrix", modelViewProjectionMatrix);
        drawCall.uniform("time", time);

        drawCall.draw();

        requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
});