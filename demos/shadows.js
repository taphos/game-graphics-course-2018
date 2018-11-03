// Cube
let positions = new Float32Array([-0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5]);
let normals = new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0]);
let triangles = new Uint16Array([2, 1, 0, 0, 3, 2, 4, 5, 6, 6, 7, 4, 8, 9, 10, 10, 11, 8, 14, 13, 12, 12, 15, 14, 16, 17, 18, 18, 19, 16, 22, 21, 20, 20, 23, 22]);


let planePositions = new Float32Array([
    -2, 0, 2,
    2, 0, 2,
    -2, 0, -2,
    2, 0, -2,
]);

let planeNormals = new Float32Array([
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0
]);

let planeTriangles = new Uint16Array([
    0, 1, 2,
    2, 1, 3
]);

// language=GLSL
let fragmentShader = `
    #version 300 es    
    precision highp float;    
    precision highp sampler2DShadow;
    
    uniform vec3 lightPosition;
    uniform vec3 cameraPosition;    
    uniform sampler2DShadow shadowMap;
    
    in vec3 vPosition;
    in vec3 vNormal;
    in vec4 vPositionFromLight;
    in vec3 vModelPosition;
    out vec4 fragColor;
    
    void main() {
        vec3 shadowCoord = (vPositionFromLight.xyz / vPositionFromLight.w) / 2.0 + 0.5;
        shadowCoord.z -= 0.01;
        float shadow = texture(shadowMap, shadowCoord);
        vec4 baseColor = vec4(1.0);
        vec3 normal = normalize(vNormal);
        vec3 eyeDirection = normalize(cameraPosition - vPosition);
        vec3 lightDirection = normalize(lightPosition - vPosition);
        vec3 reflectionDirection = reflect(-lightDirection, normal);
        float diffuse = shadow * max(dot(lightDirection, normal), 0.0) * 0.7;
        float ambient = 0.2;
        float specular = shadow * pow(max(dot(reflectionDirection, eyeDirection), 0.0), 20.0) * 0.7;
        fragColor = vec4((ambient + diffuse + specular) * baseColor.rgb, baseColor.a);
    }
`;

// language=GLSL
let vertexShader = `
    #version 300 es
    
    layout(location=0) in vec4 position;
    layout(location=1) in vec3 normal;
    
    uniform mat4 modelMatrix;
    uniform mat4 modelViewProjectionMatrix;
    uniform mat4 lightModelViewProjectionMatrix;
    
    out vec3 vPosition;
    out vec3 vNormal;
    out vec4 vPositionFromLight;
    out vec3 vModelPosition;
    
    void main() {
        gl_Position = modelViewProjectionMatrix * position;
        vModelPosition = vec3(position);
        vPosition = vec3(modelMatrix * position);
        vNormal = vec3(modelMatrix * vec4(normal, 0.0));
        vPositionFromLight = lightModelViewProjectionMatrix * position;
    }
`;

// language=GLSL
let shadowFragmentShader = `
    #version 300 es
    precision highp float;
    
    void main() {    
    }
`;

// language=GLSL
let shadowVertexShader = `
    #version 300 es
    layout(location=0) in vec4 position;
    uniform mat4 lightModelViewProjectionMatrix;
    
    void main() {
        gl_Position = lightModelViewProjectionMatrix * position;
    }
`;

app.cullBackfaces().depthTest();

let program = app.createProgram(vertexShader.trim(), fragmentShader.trim());
let shadowProgram = app.createProgram(shadowVertexShader.trim(), shadowFragmentShader.trim());

let vertexArray = app.createVertexArray()
    .vertexAttributeBuffer(0, app.createVertexBuffer(PicoGL.FLOAT, 3, positions))
    .vertexAttributeBuffer(1, app.createVertexBuffer(PicoGL.FLOAT, 3, normals))
    .indexBuffer(app.createIndexBuffer(PicoGL.UNSIGNED_SHORT, 3, triangles));

let planeArray = app.createVertexArray()
    .vertexAttributeBuffer(0, app.createVertexBuffer(PicoGL.FLOAT, 3, planePositions))
    .vertexAttributeBuffer(1, app.createVertexBuffer(PicoGL.FLOAT, 3, planeNormals))
    .indexBuffer(app.createIndexBuffer(PicoGL.UNSIGNED_SHORT, 3, planeTriangles));

// Change the shadow texture resolution to checkout the difference
let shadowResolutionFactor = 0.3;
let shadowDepthTarget = app.createTexture2D(app.width * shadowResolutionFactor, app.height * shadowResolutionFactor, {format: PicoGL.DEPTH_COMPONENT, compareMode: PicoGL.COMPARE_REF_TO_TEXTURE});
let shadowBuffer = app.createFramebuffer().depthTarget(shadowDepthTarget);

let projMatrix = mat4.create();
let viewMatrix = mat4.create();
let viewProjMatrix = mat4.create();
let modelMatrix = mat4.create();
let modelViewMatrix = mat4.create();
let modelViewProjectionMatrix = mat4.create();
let rotateXMatrix = mat4.create();
let rotateYMatrix = mat4.create();
let planeModelMatrix = mat4.create();
let planeModelViewProjectionMatrix = mat4.create();
let cameraPosition = vec3.create();
let lightModelViewProjectionMatrix = mat4.create();

var lightPosition = vec3.fromValues(2, 3, 0);
var lightViewMatrix = mat4.create();
var lightViewProjMatrix = mat4.create();
mat4.lookAt(lightViewMatrix, lightPosition, vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));


let drawCall = app.createDrawCall(program, vertexArray);
let shadowDrawCall = app.createDrawCall(shadowProgram, vertexArray);
let planeDrawCall = app.createDrawCall(program, planeArray);

function renderShadowMap()
{
    app.drawFramebuffer(shadowBuffer);
    app.viewport(0, 0, shadowDepthTarget.width, shadowDepthTarget.height);
    //app.gl.cullFace(app.gl.FRONT);
    //app.drawBackfaces();

    mat4.multiply(lightViewProjMatrix, projMatrix, lightViewMatrix);
    mat4.multiply(lightModelViewProjectionMatrix, lightViewProjMatrix, modelMatrix);

    app.clear();
    shadowDrawCall.uniform("lightModelViewProjectionMatrix", lightModelViewProjectionMatrix);
    shadowDrawCall.draw();

    //app.cullBackfaces();
    //app.gl.cullFace(app.gl.BACK);
    app.defaultDrawFramebuffer();
    app.defaultViewport();
}

function drawObjects(cameraPosition, viewMatrix) {
    mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
    mat4.multiply(modelViewProjectionMatrix, viewProjMatrix, modelMatrix);

    app.clear();
    drawCall.uniform("modelMatrix", modelMatrix);
    drawCall.uniform("modelViewProjectionMatrix", modelViewProjectionMatrix);
    drawCall.uniform("cameraPosition", cameraPosition);
    drawCall.uniform("lightPosition", lightPosition);
    drawCall.uniform("lightModelViewProjectionMatrix", lightModelViewProjectionMatrix);
    drawCall.texture("shadowMap", shadowDepthTarget);
    drawCall.draw();
}

function drawPlane() {
    mat4.multiply(planeModelViewProjectionMatrix, viewProjMatrix, planeModelMatrix);
    mat4.multiply(lightModelViewProjectionMatrix, lightViewProjMatrix, planeModelMatrix);

    planeDrawCall.uniform("modelMatrix", planeModelMatrix);
    planeDrawCall.uniform("modelViewProjectionMatrix", planeModelViewProjectionMatrix);
    planeDrawCall.uniform("cameraPosition", cameraPosition);
    planeDrawCall.uniform("lightPosition", lightPosition);
    planeDrawCall.uniform("lightModelViewProjectionMatrix", lightModelViewProjectionMatrix);
    planeDrawCall.texture("shadowMap", shadowDepthTarget);
    planeDrawCall.draw();
}

function draw() {
    let time = new Date().getTime() * 0.001;

    mat4.perspective(projMatrix, Math.PI / 2.5, app.width / app.height, 0.1, 100.0);
    vec3.rotateY(cameraPosition, vec3.fromValues(0, 2, 4), vec3.zero, time * 0.05);
    mat4.lookAt(viewMatrix, cameraPosition, vec3.fromValues(0, -0.5, 0), vec3.up);

    mat4.fromXRotation(rotateXMatrix, time * 0.1136 - Math.PI / 2);
    mat4.fromZRotation(rotateYMatrix, time * 0.2235);
    mat4.mul(modelMatrix, rotateXMatrix, rotateYMatrix);

    mat4.fromXRotation(rotateXMatrix, 0.3);
    mat4.fromYRotation(rotateYMatrix, time * 0.2354);
    mat4.mul(planeModelMatrix, rotateYMatrix, rotateXMatrix);
    mat4.setTranslation(planeModelMatrix, vec3.fromValues(0, -1, 0));

    mat4.multiply(viewProjMatrix, projMatrix, viewMatrix);

    renderShadowMap();
    drawObjects(cameraPosition, viewMatrix);
    drawPlane();

    requestAnimationFrame(draw);
}
requestAnimationFrame(draw);