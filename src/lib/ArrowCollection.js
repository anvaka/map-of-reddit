import {
  defineProgram,
  GLCollection,
  ColorAttribute,
  InstancedAttribute,
} from 'w-gl';

export default class ArrowCollection extends GLCollection {
  constructor(gl, options = {}) {
    let program = getLinesProgram(gl, options);
    super(program);

    this.arrowLength = options.arrowLength || 1;
    this.color = options.color || [1, 1, 1, 1];

    this.arrowProgram = getArrowsProgram(gl, options, program);
    this.arrowProgram.setGLBuffer(program.getGLBuffer());
  }

  draw(gl, drawContext) {
    if (!this.uniforms) {
      this.uniforms = {
        modelViewProjection: this.modelViewProjection,
        arrowLength: this.arrowLength || 1,
      };
    }
    this.program.draw(this.uniforms);
    this.arrowProgram.setCount(this.program.getCount());
    this.arrowProgram.draw(this.uniforms);
  }

  clear() {
    this.program.setCount(0);
  }

  dispose() {
    super.dispose();
    this.arrowProgram.dispose();
  }
}

function getArrowsProgram(gl, options, sourceBuffer) {
  return defineProgram({
    gl,
    sourceBuffer,
    debug: options.debug,
    vertex: `
uniform mat4 modelViewProjection;
uniform float arrowLength;

attribute vec3 from, to;
attribute vec4 fromColor, toColor;

attribute vec2 point;
attribute vec3 gaps;

varying vec4 vColor;
varying vec2 vPoint;

void main() {
  vec2 xBasis = normalize(to.xy - from.xy);
  vec2 yBasis = vec2(-xBasis.y, xBasis.x);

  vec4 clip0 = modelViewProjection * vec4(
    to.xy - (gaps.y + arrowLength) * xBasis + gaps.z * 3. * yBasis * point.x, to.z,
    1.0
  );
  vec4 clip1 = modelViewProjection * vec4(to.xy - gaps.y * xBasis, to.z, 1.0);

  gl_Position = mix(clip0, clip1, point.y);
  vColor = toColor.abgr;// mix(fromColor.abgr, toColor.abgr, point.y);
}`,

    fragment: `
precision highp float;
varying vec4 vColor;

void main() {
  gl_FragColor = vColor;
}`,
    attributes: {
      fromColor: new ColorAttribute(),
      toColor: new ColorAttribute(),
    },
    instanced: {
      point: new InstancedAttribute([-0.5, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 1, 1]),
    },
  });
}

function getLinesProgram(gl, options) {
  return defineProgram({
    capacity: options.capacity || 1,
    attributeLayout: ['from', 'to', 'fromColor', 'toColor', 'gaps'],
    buffer: options.buffer,
    debug: options.debug,
    gl,
    vertex: `
  uniform mat4 modelViewProjection;
  uniform float arrowLength;

  attribute vec3 from, to;
  attribute vec4 fromColor, toColor;
  attribute vec3 gaps;
  attribute vec2 point;

  varying vec4 vColor;
  varying vec2 vPoint;

  void main() {
    vec2 xBasis = normalize(to - from).xy;
    vec2 yBasis = vec2(-xBasis.y, xBasis.x);

    vec4 clip0 = modelViewProjection * vec4(
      xBasis * gaps.x + from.xy + gaps.z * yBasis * point.x, from.z, 1.0);
    vec4 clip1 = modelViewProjection * vec4(
      to.xy + gaps.z * yBasis * point.x - xBasis * (gaps.y + arrowLength), to.z, 1.0
    );

    gl_Position = mix(clip0, clip1, point.y);
    vColor = mix(fromColor.abgr, toColor.abgr, point.y);
  }`,

    fragment: `
  precision highp float;
  varying vec4 vColor;

  void main() {
    gl_FragColor = vColor;
  }`,
    attributes: {
      fromColor: new ColorAttribute(),
      toColor: new ColorAttribute(),
    },
    instanced: {
      point: new InstancedAttribute([
        -0.5,
        0,
        -0.5,
        1,
        0.5,
        1, // First 2D triangle of the quad
        -0.5,
        0,
        0.5,
        1,
        0.5,
        0, // Second 2D triangle of the quad
      ]),
    },
  });
}
