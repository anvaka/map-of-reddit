import {GLCollection, defineProgram, ColorAttribute} from 'w-gl';

const tex = [
  [0, 0],
  [1, 0],
  [1, 1],
  [1, 1],
  [0, 1],
  [0, 0]
]
export class BoxCollection extends GLCollection {
  constructor(gl, options) {
    let program = defineProgram({
      gl,
      capacity: options.capacity,
      vertex: `
  uniform mat4 modelViewProjection;
  attribute vec3 point;
  attribute vec2 texCoordinate;
  attribute vec4 color;
  varying vec3 vPoint;
  varying vec2 vTex;
  varying vec4 vColor;

  void main() {
    vec4 pos = modelViewProjection * vec4(point, 1.0);
    gl_Position = pos;
    vPoint = point;
    vTex = texCoordinate;
    vColor = color.abgr;
  }`,

      fragment: `
      precision highp float;
      uniform vec3 camera;
      varying vec3 vPoint;
      varying vec2 vTex;
      varying vec4 vColor;

      void main() {
        vec4 col = vec4(0);
        col += length(smoothstep(0.48, 0.5, abs(vTex - 0.5)));
        col += vColor;
        col[3] = 0.7;
        gl_FragColor = col;
      }`,

        attributes: {
          color: new ColorAttribute(),
        },
        preDrawHook(/* programInfo */) {
          return `
          // gl.disable(gl.BLEND);
          gl.enable(gl.DEPTH_TEST);
          gl.depthFunc(gl.LEQUAL);
          `;
        },
        postDrawHook() {
          return `
          //gl.enable(gl.BLEND);
           gl.disable(gl.DEPTH_TEST);
           `;
        },
    });
    super(program);

    this.uiIDToUI = new Map();
  }

  draw(gl, drawContext) {
    if (!this.uniforms) {
      this.uniforms = {
        modelViewProjection: this.modelViewProjection,
        camera: drawContext.view.position
      };
    }
    this.uniforms.opacity = this.opacity;
    this.program.draw(this.uniforms);
  }

  setColor(box, color){
    this.setFaceColor(box.front, color);
    this.setFaceColor(box.left, color);
    this.setFaceColor(box.right, color);
    this.setFaceColor(box.back, color);
  }

  setFaceColor(face, color) {
    face.forEach(point => {
      point.color = color;
      this.update(point.uiId, point);
    })
  }

  addBox(box) {
    let frontUI, leftUI, rightUI, backUI, topUI;
    let front = this.getFace(box.width, box.height);
    this.rotateFace(front, Math.PI/2, 'x')
    this.translateFace(front, [0, 0, box.height/2]);
    this.rotateFace(front, Math.PI/2, 'z')
    this.translateFace(front, [box.x+box.width/2,box.y, 0]);
    //this.translateFace(front, [box.x, box.y, 0]);
    frontUI = this.addFace(front);
    frontUI.name = 'front';

    let left = this.getFace(box.width, box.height);
    this.rotateFace(left, Math.PI/2, 'x')
    this.translateFace(left, [0, 0, box.height / 2]);
    this.translateFace(left, [0, -box.width/2, 0]);
    this.translateFace(left, [box.x, box.y, 0]);
    leftUI = this.addFace(left);
    leftUI.name = 'left';

    let right = this.getFace(box.width, box.height);
    this.rotateFace(right, Math.PI/2, 'x')
    this.translateFace(right, [0, 0, box.height / 2]);
    this.rotateFace(right, Math.PI, 'z')
    this.translateFace(right, [0, box.width/2, 0]);
    this.translateFace(right, [box.x, box.y, 0]);
    rightUI = this.addFace(right);
    rightUI.name = 'right';

    let back = this.getFace(box.width, box.height);
    this.rotateFace(back, Math.PI/2, 'x')
    this.translateFace(back, [0, 0, box.height/2]);
    this.rotateFace(back, -Math.PI/2, 'z')
    this.translateFace(back, [-box.width/2,0, 0]);
    this.translateFace(back, [box.x, box.y, 0]);
    backUI = this.addFace(back);
    backUI.name = 'back';

    let top = this.getFace(box.width, box.width);
    this.translateFace(top, [box.x, box.y, box.height]);
    topUI = this.addFace(top);

    return {
      front: frontUI,
      left: leftUI,
      right: rightUI,
      back: backUI,
      top: topUI
    }
  }

  removeBox(box) {
    this.removeFace(box.front);
    this.removeFace(box.left);
    this.removeFace(box.right);
    this.removeFace(box.back);
  }

  translateFace(face, d) {
    face.forEach(point => {
      point[0] += d[0];
      point[1] += d[1];
      point[2] += d[2];
    });
  }

  rotateFace(face, angle, axis) {
    let c = Math.cos(angle), s = Math.sin(angle);
    face.forEach(point => {
      let [x, y, z] = point;
      let x0, y0, z0;
      if (axis === 'z') {
        x0 = c * x - s * y;
        y0 = s * x + c * y;
        z0 = z;
      } else if (axis === 'y') {
        x0 = x * c + z * s;
        y0 = y;
        z0 = -x * s + z * c;
      }  else if (axis === 'x') {
        x0 = x;
        y0 = y * c - z * s;
        z0 = y * s + z * c;
      } else {
        throw new Error('Not supported axis ' + axis);
      }
      point[0] = x0;
      point[1] = y0;
      point[2] = z0;
    })
  }

  getFace(width, height) {
    return [
      [ - width/2, - height/2, 0], // (0, 0)
      [ + width/2, - height/2, 0], // (1, 0)
      [ + width/2, + height/2, 0], // (1, 1)

      [ + width/2, + height/2, 0], // (1, 1)
      [ - width/2, + height/2, 0], // (0, 1)
      [ - width/2, - height/2, 0], // (0, 0)
    ];
  }

  addFace(quadPoints) {
    return quadPoints.map((point, i) => {
      let ui = {
        point,
        uiId: -1,
        color: 0x292C33ff,
        texCoordinate: tex[i]
      };
      ui.uiId = this.add(ui);
      this.uiIDToUI.set(ui.uiId, ui);
      return ui;
    })
  }

  removeFace(quadUI) {
    quadUI.forEach(ui => {
      let oldId = ui.uiId;
      let newId = this.remove(oldId);
      let movedUI = this.uiIDToUI.get(newId);
      if(!movedUI) {
        throw new Error("Missing ui element");
      }
      this.uiIDToUI.delete(newId);
      if (newId !== oldId) {
        movedUI.uiId = oldId;
        this.uiIDToUI.set(oldId, movedUI);
      }
    })
  }

  clear() {
    throw new Error('Not implemented');
  }
}
