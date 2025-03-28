const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl");

function resizeCanvas() {
  // console.log("Resizing canvas to:", canvas.width, canvas.height, window.innerWidth, window.innerHeight);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);


const vertexShaderSource = `
    attribute vec4 a_position;
    void main() {
        gl_Position = a_position;
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    uniform vec3      iResolution;           // viewport resolution (in pixels)
    uniform float     iTime;                 // shader playback time (in seconds)
    uniform float     iTimeDelta;            // render time (in seconds)
    uniform float     iFrameRate;            // shader frame rate
    uniform int       iFrame;                // shader playback frame
    uniform float     iChannelTime[4];       // channel playback time (in seconds)
    uniform vec3      iChannelResolution[4]; // channel resolution (in pixels)
    uniform vec4      iMouse;                // mouse pixel coords. xy: current (if MLB down), zw: click
    uniform sampler2D iChannel0;             // input channel 0
    uniform sampler2D iChannel1;             // input channel 1
    uniform sampler2D iChannel2;             // input channel 2
    uniform sampler2D iChannel3;             // input channel 3
    uniform vec4      iDate;                 // (year, month, day, time in seconds)
    /*
        "Singularity" by @XorDev

        I'll come back to clean up the code later.
        Feel free to code golf!
        FabriceNeyret2: -19
        dean_the_coder: -12
        iq: -4
    */

    void mainImage(out vec4 O, vec2 F)
    {
        float i = 0.0, j;
        vec2 r = iResolution.xy,                              // screen resolution r
             p = (F + F - r ) / r.y / .7,                     // normalized coordinates p
             d = vec2(-1, 1),                                // direction vec d
             q = 1. * p - d,                                 // scaled coordinates q
             c = p * mat2(1, 1, d / (.1 + 5. / dot(q, q))),   // rotated coordinates c
             v = c * mat2(cos(.5 * log(j = dot(c, c)) + iTime*.2 + vec4(0, 33, 11, 0))) * 5.,
             s = vec2(0.0);

        for(float k = 0.1; k < 9.0; k += .9) {
            s += 1.0 + sin(v);
            v += 0.7 * sin(v.yx * k + iTime) / k + 0.5;
        }
        i = length(sin(v / .3) * .4 + c * (.1 + d));
        O = 1.0 - exp(-exp(c.x * vec4(.6, -.4, -1, 0))
                    / s.xyyx
                    / (2.0 + i * i / 4.0 - i )
                    / (0.2 + 3.5 * exp(.3 * c.y - j ))
                    / (0.05 + abs(length(p) - .7 )));
    }

    void main()
    {
        mainImage(gl_FragColor, gl_FragCoord.xy);
    }
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

const vertexShader = createShader(
  gl,
  gl.VERTEX_SHADER,
  vertexShaderSource
);
const fragmentShader = createShader(
  gl,
  gl.FRAGMENT_SHADER,
  fragmentShaderSource
);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  console.error(gl.getProgramInfoLog(program));
}
gl.useProgram(program);

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
  gl.STATIC_DRAW
);

const positionLocation = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

const resolutionLocation = gl.getUniformLocation(program, "iResolution");
const timeLocation = gl.getUniformLocation(program, "iTime");


function render(time) {
  time *= 0.001;
  gl.uniform3f(resolutionLocation, canvas.width, canvas.height, 1.0);
  gl.uniform1f(timeLocation, time);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  requestAnimationFrame(render);
}
requestAnimationFrame(render);