// Nataly Tuong
// Joshua Xotoy
// William Lopez

// 11-12-2026

// HW6A

"use strict";

var canvas, gl, program;

var positionsArray = [];
var normalsArray = [];
var texCoordsArray = [];

// Phong lighting
var lightPosition = vec4(0.4, 0.8, 0.45, 0.0);

var lightAmbient = vec4(0.4, 0.4, 0.4, 1.0);
var lightDiffuse = vec4(1.1, 1.1, 1.1, 1.0);
var lightSpecular = vec4(0.8, 0.8, 0.8, 1.0);

var materialAmbient = vec4(0.05, 0.12, 0.35, 1.0);
var materialDiffuse = vec4(0.6, 1.0, 0.25, 1.0);
var materialSpecular = vec4(0.9, 1.0, 0.75, 1.0);
var materialShininess = 60.0;

// Camera
var eye = vec3(0.0, 0.0, 34.0);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

// Rotation
var thetaX = 20;
var thetaY = 30;
var speed = 2.0;
var keysDown = {};

var modelViewLoc;

// Clover shape
var leaf = [
    [-1.5, 6, 2, 1],
    [1.5, 6, 2, 1],
    [0, 4.5, 7, 2],
    [0, 3, 5, 1],
    [0, 2, 3, 1]
];

var center = [0, 0, 3, 3];

var stem = [
    [0, -7, 1, 3],
    [-1.5, -8, 2, 1]
];

var thickness = 4.0;


// Create a face with texture coordinates
function quad(v, a, b, c, d) {

    var normal = normalize(
        cross(
            subtract(v[b], v[a]),
            subtract(v[c], v[b])
        )
    );

    var order = [a, b, c, a, c, d];

    // Map the external image onto each face
    var texCoords = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(1, 1),
        vec2(0, 0),
        vec2(1, 1),
        vec2(1, 0)
    ];

    for (var i = 0; i < order.length; i++) {

        positionsArray.push(v[order[i]]);
        normalsArray.push(normal);
        texCoordsArray.push(texCoords[i]);
    }
}


// Create a rectangular box
function box(cx, cy, w, h) {

    var hx = w / 2;
    var hy = h / 2;
    var z = thickness / 2;

    var v = [
        vec4(cx - hx, cy - hy, z, 1.0),
        vec4(cx - hx, cy + hy, z, 1.0),
        vec4(cx + hx, cy + hy, z, 1.0),
        vec4(cx + hx, cy - hy, z, 1.0),

        vec4(cx - hx, cy - hy, -z, 1.0),
        vec4(cx - hx, cy + hy, -z, 1.0),
        vec4(cx + hx, cy + hy, -z, 1.0),
        vec4(cx + hx, cy - hy, -z, 1.0)
    ];

    quad(v, 1, 0, 3, 2);
    quad(v, 2, 3, 7, 6);
    quad(v, 3, 0, 4, 7);
    quad(v, 6, 5, 1, 2);
    quad(v, 4, 5, 6, 7);
    quad(v, 5, 4, 0, 1);
}


// Build the clover
function buildClover() {

    for (var k = 0; k < 4; k++) {

        for (var i = 0; i < leaf.length; i++) {

            var x = leaf[i][0];
            var y = leaf[i][1];
            var w = leaf[i][2];
            var h = leaf[i][3];

            // Rotate each leaf by 90 degrees
            for (var turn = 0; turn < k; turn++) {

                var oldX = x;
                x = -y;
                y = oldX;

                var oldW = w;
                w = h;
                h = oldW;
            }

            box(x, y, w, h);
        }
    }

    // Center
    box(center[0], center[1], center[2], center[3]);

    // Stem
    for (var s = 0; s < stem.length; s++) {
        box(stem[s][0], stem[s][1], stem[s][2], stem[s][3]);
    }
}


// Load external texture
function loadTexture() {

    var texture = gl.createTexture();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Temporary white texture while image loads
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([255, 255, 255, 255])
    );

    var image = new Image();

    image.onload = function () {

        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        // Upload external image
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );

        // Generate texture mipmaps
        gl.generateMipmap(gl.TEXTURE_2D);

        console.log("Texture loaded successfully!");
    };

    image.onerror = function () {
        console.error("Unable to load clover-texture.jpg");
    };

    // External image filename
    image.src = "clover-texture.jpg";

    // Texture filtering
    gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR
    );

    gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MAG_FILTER,
        gl.LINEAR
    );

    // Texture wrapping
    gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_WRAP_S,
        gl.REPEAT
    );

    gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_WRAP_T,
        gl.REPEAT
    );

    // Connect texture to shader
    gl.uniform1i(
        gl.getUniformLocation(program, "uTexture"),
        0
    );
}


// Initialize WebGL
window.onload = function init() {

    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext("webgl2");

    if (!gl) {
        alert("WebGL 2.0 isn't available");
        return;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(
        gl,
        "vertex-shader",
        "fragment-shader"
    );

    gl.useProgram(program);

    // Build object
    buildClover();


    // Position buffer
    var vBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        flatten(positionsArray),
        gl.STATIC_DRAW
    );

    var positionLoc = gl.getAttribLocation(
        program,
        "aPosition"
    );

    gl.vertexAttribPointer(
        positionLoc,
        4,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.enableVertexAttribArray(positionLoc);


    // Normal buffer
    var nBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        flatten(normalsArray),
        gl.STATIC_DRAW
    );

    var normalLoc = gl.getAttribLocation(
        program,
        "aNormal"
    );

    gl.vertexAttribPointer(
        normalLoc,
        3,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.enableVertexAttribArray(normalLoc);


    // Texture coordinate buffer
    var tBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        flatten(texCoordsArray),
        gl.STATIC_DRAW
    );

    var texCoordLoc = gl.getAttribLocation(
        program,
        "aTexCoord"
    );

    gl.vertexAttribPointer(
        texCoordLoc,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.enableVertexAttribArray(texCoordLoc);


    // Phong lighting
    gl.uniform4fv(
        gl.getUniformLocation(program, "uAmbientProduct"),
        mult(lightAmbient, materialAmbient)
    );

    gl.uniform4fv(
        gl.getUniformLocation(program, "uDiffuseProduct"),
        mult(lightDiffuse, materialDiffuse)
    );

    gl.uniform4fv(
        gl.getUniformLocation(program, "uSpecularProduct"),
        mult(lightSpecular, materialSpecular)
    );

    gl.uniform4fv(
        gl.getUniformLocation(program, "uLightPosition"),
        lightPosition
    );

    gl.uniform1f(
        gl.getUniformLocation(program, "uShininess"),
        materialShininess
    );


    // Perspective projection
    var projectionMatrix = perspective(
        45.0,
        canvas.width / canvas.height,
        0.1,
        100.0
    );

    gl.uniformMatrix4fv(
        gl.getUniformLocation(program, "uProjectionMatrix"),
        false,
        flatten(projectionMatrix)
    );

    modelViewLoc = gl.getUniformLocation(
        program,
        "uModelViewMatrix"
    );


    // Load external texture
    loadTexture();


    // Arrow-key controls
    window.addEventListener("keydown", function (e) {

        if (e.key.indexOf("Arrow") !== 0) return;

        keysDown[e.key] = true;
        e.preventDefault();
    });

    window.addEventListener("keyup", function (e) {

        keysDown[e.key] = false;
    });


    render();
};


// Render and rotate object
function render() {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Rotate around Y axis
    if (keysDown["ArrowLeft"]) thetaY += speed;
    if (keysDown["ArrowRight"]) thetaY -= speed;

    // Rotate around X axis
    if (keysDown["ArrowUp"]) thetaX += speed;
    if (keysDown["ArrowDown"]) thetaX -= speed;


    var viewMatrix = lookAt(eye, at, up);

    var modelMatrix = mult(
        rotate(thetaX, vec3(1, 0, 0)),
        rotate(thetaY, vec3(0, 1, 0))
    );

    gl.uniformMatrix4fv(
        modelViewLoc,
        false,
        flatten(mult(viewMatrix, modelMatrix))
    );


    // Draw textured clover
    gl.drawArrays(
        gl.TRIANGLES,
        0,
        positionsArray.length
    );

    requestAnimationFrame(render);
}
