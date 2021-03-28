import {GLCollection, defineProgram, InstancedAttribute, ColorAttribute} from 'w-gl';

// Note: the shader has a bug with z coordinate of the arrow. I'm still keeping it and maybe will get back
// to it later
export default class LineCollection extends GLCollection {
    constructor(gl, options) {
      let program = defineProgram({
        gl,
        vertex: `
uniform mat4 modelViewProjection;
uniform float width;

attribute vec3 from, to;
attribute vec2 point;
attribute vec4 color;
varying vec2 vPoint;
varying vec4 vColor;

void main() {
  vec2 xBasis = normalize(to - from).xy;
  vec2 yBasis = vec2(-xBasis.y, xBasis.x);
  vec4 clip0 = modelViewProjection * vec4(from.xy + width * yBasis * point.x, from.z, 1.0);
  vec4 clip1 = modelViewProjection * vec4(to.xy + width * yBasis * point.x, to.z, 1.0);
  gl_Position = mix(clip0, clip1, point.y);
  vColor = color;
}`,

        fragment: `
    precision highp float;
    varying vec4 vColor;

    void main() {
      gl_FragColor = vColor.abgr;
    }`,
      attributes: {
        color: new ColorAttribute(),
      },
      instanced: {
          point: new InstancedAttribute([
            -0.5, 0, -0.5, 1, 0.5, 1, // First 2D triangle of the quad
            -0.5, 0, 0.5, 1, 0.5, 0   // Second 2D triangle of the quad
          ])
        }
      });
      super(program);
      this.width = (options && options.width) || 1;
    }

    draw() {
      if (!this.uniforms) {
        this.uniforms = {
          modelViewProjection: this.modelViewProjection,
          width: this.width,
        }
      }
      this.uniforms.width = this.width;
      this.program.draw(this.uniforms);
    }
    // add(line) {
    //   if (line.width === undefined) line.width = this.width;
    //   super.add(line);
    // }

    clear() {
      this.program.setCount(0);
    }
  }