import earcut from 'earcut';
import {defineProgram, ColorAttribute, GLCollection} from 'w-gl';

export default class PolyLineCollection extends GLCollection {
  constructor(gl, options = {}) {
    let program = defineProgram({
      gl,
      debug: options.debug,
      vertex: `
  uniform mat4 modelViewProjection;
  uniform float opacity;

  attribute vec2 point;
  attribute vec4 color;
  varying vec4 vColor;

  void main() {
    gl_Position = modelViewProjection * vec4(point, -1.0, 1.0);
    vColor = color.abgr;
    vColor[3] *= opacity;
  }`,

      fragment: `
  precision highp float;

  varying vec4 vColor;

  void main() {
    gl_FragColor = vColor;
  }`,
      attributes: {
        color: new ColorAttribute(),
      },
    });
    super(program);
    this.opacity = options.opacity === undefined ? 1 : options.opacity;
    this.color = options.color || 0x000000ff;
  }

  draw() {
    if (!this.uniforms) {
      this.uniforms = {
        modelViewProjection: this.modelViewProjection,
        opacity: this.opacity
      };
    }
    this.uniforms.opacity = this.opacity;
    this.program.draw(this.uniforms);
  }

  clear() {
    this.program.setCount(0);
  }

  addPolygon({ polygon, color }) {
    polygon = polygon.flat();
    let triangles = earcut(polygon);
    for (let i = 0; i < triangles.length; i++) {
      let index = triangles[i] * 2;
      this.add({
        point: [polygon[index], polygon[index + 1]],
        color: color || this.color,
      });
    }

    for (let i = 0; i < 3; ++i) {
      this.add({
        point: [0, 0],
        color: 0x0,
      });
    }
  }
}
