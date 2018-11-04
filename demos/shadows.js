// Cube
let positions = new Float32Array([-0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5]);
let normals = new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0]);
let triangles = new Uint16Array([2, 1, 0, 0, 3, 2, 4, 5, 6, 6, 7, 4, 8, 9, 10, 10, 11, 8, 14, 13, 12, 12, 15, 14, 16, 17, 18, 18, 19, 16, 22, 21, 20, 20, 23, 22]);


// language=GLSL
let fragmentShader = `
    #version 300 es    
    precision highp float;    
    precision highp sampler2DShadow;
    
    uniform vec4 baseColor;
    uniform vec4 ambientColor;
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
        float shadow = texture(shadowMap, shadowCoord);
        
        vec3 normal = normalize(vNormal);
        vec3 eyeDirection = normalize(cameraPosition - vPosition);
        vec3 lightDirection = normalize(lightPosition - vPosition);        
        vec3 reflectionDirection = reflect(-lightDirection, normal);
        
        float diffuse = shadow * max(dot(lightDirection, normal), 0.0);        
        float specular = shadow * pow(max(dot(reflectionDirection, eyeDirection), 0.0), 20.0) * 0.7;
        fragColor = vec4(diffuse * baseColor.rgb + ambientColor.rgb + specular, baseColor.a);
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
    
    out vec4 fragColor;
    
    void main() {
        // Uncomment to see the depth buffer of the shadow map    
        //fragColor = vec4((gl_FragCoord.z - 0.98) * 50.0);    
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

let bgColor = vec4.fromValues(1.0, 0.2, 0.3, 1.0);
let fgColor = vec4.fromValues(1.0, 0.9, 0.5, 1.0);

app.cullBackfaces().depthTest().clearColor(bgColor[0], bgColor[1], bgColor[2], bgColor[3]);

let program = app.createProgram(vertexShader.trim(), fragmentShader.trim());
let shadowProgram = app.createProgram(shadowVertexShader.trim(), shadowFragmentShader.trim());

let vertexArray = app.createVertexArray()
    .vertexAttributeBuffer(0, app.createVertexBuffer(PicoGL.FLOAT, 3, positions))
    .vertexAttributeBuffer(1, app.createVertexBuffer(PicoGL.FLOAT, 3, normals))
    .indexBuffer(app.createIndexBuffer(PicoGL.UNSIGNED_SHORT, 3, triangles));

// Change the shadow texture resolution to checkout the difference
let shadowDepthTarget = app.createTexture2D(512, 512, {
        format: PicoGL.DEPTH_COMPONENT,
        compareMode: PicoGL.COMPARE_REF_TO_TEXTURE,
        magFilter: PicoGL.LINEAR,
    });
let shadowBuffer = app.createFramebuffer().depthTarget(shadowDepthTarget);

let time = 0;
let projMatrix = mat4.create();
let viewMatrix = mat4.create();
let viewProjMatrix = mat4.create();
let modelMatrix = mat4.create();
let modelViewProjectionMatrix = mat4.create();
let rotateXMatrix = mat4.create();
let rotateYMatrix = mat4.create();
let lightModelViewProjectionMatrix = mat4.create();

let cameraPosition = vec3.fromValues(0, 2, 4);
var lightPosition = vec3.fromValues(5, 5, 2.5);
var lightViewMatrix = mat4.create();
var lightViewProjMatrix = mat4.create();
mat4.lookAt(lightViewMatrix, lightPosition, vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));


let drawCall = app.createDrawCall(program, vertexArray)
                        .uniform("baseColor", fgColor)
                        .uniform("ambientColor", vec4.scale(vec4.create(), bgColor, 0.7))
                        .uniform("modelMatrix", modelMatrix)
                        .uniform("modelViewProjectionMatrix", modelViewProjectionMatrix)
                        .uniform("cameraPosition", cameraPosition)
                        .uniform("lightPosition", lightPosition)
                        .uniform("lightModelViewProjectionMatrix", lightModelViewProjectionMatrix)
                        .texture("shadowMap", shadowDepthTarget);

let shadowDrawCall = app.createDrawCall(shadowProgram, vertexArray)
                        .uniform("lightModelViewProjectionMatrix", lightModelViewProjectionMatrix);

function renderShadowMap() {
    app.drawFramebuffer(shadowBuffer);
    app.viewport(0, 0, shadowDepthTarget.width, shadowDepthTarget.height);
    app.gl.cullFace(app.gl.FRONT);

    // Change the projection and view matrices to render objects from the point view of light source
    mat4.perspective(projMatrix, Math.PI * 0.1, shadowDepthTarget.width / shadowDepthTarget.height, 0.1, 100.0);
    mat4.multiply(lightViewProjMatrix, projMatrix, lightViewMatrix);

    drawObjects(shadowDrawCall);

    app.gl.cullFace(app.gl.BACK);
    app.defaultDrawFramebuffer();
    app.defaultViewport();
}

function drawObjects(dc) {
    app.clear();

    mat4.fromXRotation(rotateXMatrix, time * 0.536);
    mat4.fromZRotation(rotateYMatrix, time * 0.633);
    mat4.mul(modelMatrix, rotateXMatrix, rotateYMatrix);
    mat4.scale(modelMatrix, modelMatrix, [0.8, 0.8, 0.8]);

    mat4.multiply(modelViewProjectionMatrix, viewProjMatrix, modelMatrix);
    mat4.multiply(lightModelViewProjectionMatrix, lightViewProjMatrix, modelMatrix);

    dc.draw();

    mat4.fromXRotation(rotateXMatrix, time * 0.1136);
    mat4.fromYRotation(rotateYMatrix, time * 0.1533);
    mat4.mul(modelMatrix, rotateYMatrix, rotateXMatrix);
    mat4.scale(modelMatrix, modelMatrix, [2, 2, 2]);
    mat4.setTranslation(modelMatrix, vec3.fromValues(-2.4, -2.4, -1.2));

    mat4.multiply(modelViewProjectionMatrix, viewProjMatrix, modelMatrix);
    mat4.multiply(lightModelViewProjectionMatrix, lightViewProjMatrix, modelMatrix);

    dc.draw();

    mat4.scale(modelMatrix, modelMatrix, [0.15, 0.15, 0.15]);
    mat4.setTranslation(modelMatrix, vec3.fromValues(0.9, 0.9, 0.6));

    mat4.multiply(modelViewProjectionMatrix, viewProjMatrix, modelMatrix);
    mat4.multiply(lightModelViewProjectionMatrix, lightViewProjMatrix, modelMatrix);

    dc.draw();
}

function draw() {
    time = new Date().getTime() * 0.001;

    mat4.perspective(projMatrix, Math.PI / 2.5, app.width / app.height, 0.1, 100.0);
    mat4.lookAt(viewMatrix, cameraPosition, vec3.fromValues(0, -0.5, 0), vec3.up);
    mat4.multiply(viewProjMatrix, projMatrix, viewMatrix);

    renderShadowMap();
    drawObjects(drawCall);

    requestAnimationFrame(draw);
}
requestAnimationFrame(draw);