import { fpsControls, mapControls, createFPSControlsUI, DomElement, DomContainer } from 'w-gl';
import { BoxCollection } from './BoxCollection';
import {quat, mat4, vec3} from 'gl-matrix';
import knn from 'rbush-knn';
import bus, { setProgress } from './bus';
import { formatNumber } from './utils';

export default function createStreetView(scene, spatialIndex, nameToUI, subreddit, viewBox) {
  let api = {
    enter, 
    exit, 
    dispose,
    lookAt
  };
  let fpsUI;
  let boxes, items, asyncRender;
  let visibleBoxes = new Set();
  let visibilityUpdate = 0;
  let uiToBox = new Map();
  let visibleElements = new Map();
  let lastVisibilityUpdate = 0;
  let domContainer = new DomContainer({seeThrough: true});

  return api;

  function lookAt(name) {
    let node = nameToUI.get(name);
    if (!node) return;

    let [x, y] = node.position;
    let size = node.size || 10;
    let a = Math.tan(scene.getDrawContext().fov/2);
    let cameraController = scene.getCameraController();
    cameraController.lookAt(
      [x, y - 2*size/a, 4],
      [x, y, size], 
    );
  }

  function dispose() {
    cancelAnimationFrame(asyncRender);
    asyncRender = 0;
    clearTimeout(visibilityUpdate);
    scene.removeChild(boxes);
    scene.removeChild(domContainer);
  }

  function enter() {
    let cameraController = scene.setCameraController(fpsControls);
    lookAt(subreddit);

    let minDimension = Math.min(viewBox.width, viewBox.height);
    let moveSpeed = minDimension / 51000;
    if (!Number.isFinite(moveSpeed)) moveSpeed = 0.1;

    cameraController.setMoveSpeed(moveSpeed).setScrollSpeed(moveSpeed * 10).setFlySpeed(moveSpeed / 5).enableMouseCapture(true);
    fpsUI = createFPSControlsUI(document.body, cameraController);

    items = spatialIndex.all();
    boxes = new BoxCollection(scene.getGL(), {
      capacity: items.length * 5 * 6
    });
    scene.appendChild(boxes);
    scene.appendChild(domContainer);

    renderFirstBatch(subreddit);
    scheduleVisibilityUpdate();
  }

  function renderFirstBatch(name) {
    let node = nameToUI.get(name);
    if (!node) return;

    let [x, y] = node.position;
    let neighbors = knn(spatialIndex, x, y, 60);
    neighbors.forEach(item => {
      let ui = item.ui;
      let [x, y] = ui.position;
      let box = boxes.addBox({
        x, y,
        width: ui.size,
        height: ui.size * 2
      });
      uiToBox.set(ui, box);
    });

    renderTheRest();
  }

  function renderTheRest() {
    let index = 0;
    asyncRender = requestAnimationFrame(processNext);

    function processNext() {
      let localCount = 0;
      while (index < items.length && localCount < 1000) {
        let item = items[index];
        let ui = item.ui;
        index += 1;

        if (uiToBox.has(ui)) continue; // processed in the first batch;

        let [x, y] = ui.position;
        let box = boxes.addBox({
          x, y,
          width: ui.size,
          height: ui.size * 2
        });
        uiToBox.set(ui, box);
        localCount += 1;
      }

      scene.renderFrame();

      if (index < items.length) {
        setProgress(() => ({
          message: 'Initializing street view: ' + formatNumber(index) + '/' + formatNumber(items.length)
        }));
        asyncRender = requestAnimationFrame(processNext);
      } else {
        // all rendered!
        setProgress(() => ({
          streetViewDone: true,
        }));
        scene.on('transform', handleTransform);
        // scheduleVisibilityUpdate();
        asyncRender = 0;
      }
    }
  }

  function exit() {
    visibleElements.forEach((el, name) => hideElement(name));

    fpsUI.dispose();
    scene.off('transform', handleTransform);
    scene.setCameraController(mapControls);
    scene.removeChild(boxes);
  }

  function showElement(face, name) {
    let el = visibleElements.get(name);
    if (!el || face !== el.face) {
      if (el && el.face) {
        // boxes.setFaceColor(el.face, 0x606060ff);
        domContainer.removeChild(el.dom);
      }
      let a = face[0].point;
      let b = face[1].point;
      let c = face[2].point;

      let dx = b[0] - a[0];
      let dy = b[1] - a[1];
      let l = Math.sqrt(dx * dx + dy * dy);
      let dom = new DomElement({width: '400px',  height: '800px'});
      let scale = l/400; // assume 400 px for dom element width

      // center of the face
      let ox = (a[0] + b[0]) / 2;
      let oy = (a[1] + b[1]) / 2;
      let oz = (a[2] + c[2]) / 2;

      // face normal
      let n = vec3.cross([], [b[0] - a[0], b[1] - a[1], b[2] - a[2]], [c[0] - a[0], c[1] - a[1], c[2] - a[2]])
      normalize(n, n);
      // rotate the dom plane normal ([0, 0, 1]) to match face normal
      let q = quat.rotationTo([], [0, 0, 1], n);
      // Rotation above is not unique, so we manually rotate dom plane until it aligns with 
      // logical box placement. This probably could be done easier, I just don't know how yet:
      if (face.name === 'back') {
        quat.rotateZ(q, q, -Math.PI/2)
      } else if (face.name === 'front') {
        quat.rotateZ(q, q, Math.PI/2)
      } else if (face.name === 'right') {
        quat.rotateZ(q, q, Math.PI)
      }

      mat4.fromRotationTranslationScale(dom.model, q,  [ox, oy, oz], [scale, scale, scale]);
      dom.worldTransformNeedsUpdate = true;
      bus.fire('append-dom', {name: name, dom: dom.el})
      domContainer.appendChild(dom)

      visibleElements.set(name, {face, dom});
    } 
  }
  function hideElement(name) {
    let el = visibleElements.get(name);
    if (el) {
      bus.fire('remove-dom', {name: name, dom: el.dom.el})
      domContainer.removeChild(el.dom);
      visibleElements.delete(name);
    }
  }

  function handleTransform(e) {
    let dc = e.drawContext;
    let z = dc.view.position[2];
    if(z < 10) {
      dc.view.position[2] = 10;
      e.updated = true;
    }
    // let moveSpeed = 3+smoothStep(0, 3000, z) * 14;
    // scene.getCameraController().setMoveSpeed(moveSpeed);
    scheduleVisibilityUpdate();
  }

  function scheduleVisibilityUpdate() {
    clearTimeout(visibilityUpdate);
    let now = window.performance.now();
    let elapsed = now - lastVisibilityUpdate;
    if (elapsed < 500) {
      visibilityUpdate = setTimeout(updateVisibility, elapsed);
    } else {
      updateVisibility();
    }
  }

  function updateVisibility() {
    lastVisibilityUpdate = window.performance.now();

    let dc = scene.getDrawContext();

    let eye = dc.view.position;
    let center = dc.view.center;
    let lookDirection = getDirection(eye, center);
    let neighbors = getMostVisibleNeighbors(eye, lookDirection, /* maxNeighbors =*/ 10, /* maxAngle =*/ 35);
    neighbors = neighbors.map(n => {
      let dx = n.ui.position[0] - eye[0];
      let dy = n.ui.position[1] - eye[1];
      let dist = (dx * dx + dy * dy);
      return {
        ui: n.ui,
        size: n.ui.size,
        dist 
      }
    }).sort((a, b) => {
      return b.size/b.dist - a.size/a.dist; //b.ui.size - a.ui.size
    }).slice(0, 4);
    if (!neighbors.length) return;

    let nowVisible = new Set();
    neighbors.forEach(box => {
      if (uiToBox.has(box.ui)) {
        // we might not have finished rendering yet.
        nowVisible.add(box.ui);
      }
    });
    visibleBoxes.forEach(ui => {
      if (!nowVisible.has(ui)) {
        hideElement(ui.name);
      }
    });

    let intersections = [];
    nowVisible.forEach(ui => {
      let box = uiToBox.get(ui);
      if(!box) {
        throw new Error('missing ui');
      }

      let minT = Infinity;
      let minFace = box.front;
      minT = checkFaceIntersection(box, box.front);

      let t = checkFaceIntersection(box, box.back);
      if (t < minT) { minT = t; minFace = box.back; }

      t = checkFaceIntersection(box, box.left);
      if (t < minT) { minT = t; minFace = box.left; }

      t = checkFaceIntersection(box, box.right);
      if (t < minT) { minT = t; minFace = box.right; }

      if (Number.isFinite(minT)) intersections.push({t: minT, face: minFace, name: ui.name});
    });

    visibleBoxes = nowVisible;
    intersections.sort((a, b) => a.t - b.t)
    let count = Math.min(10, intersections.length);
    for (let i = 0; i< count; ++i) {
      showElement(intersections[i].face, intersections[i].name);
    }
    scene.renderFrame();

    function checkFaceIntersection(box, face) {
      let a = face[0].point;
      let b = face[1].point;
      return castRay(eye, a, b);
    }

    function castRay(from, a, b) {
      let [r_px, r_py] = from;
      let [s_px, s_py] = a;
      let s_dx = b[0] - a[0];
      let s_dy = b[1] - a[1];
      let cx = s_px + 0.5*s_dx;
      let cy = s_py + 0.5*s_dy;
      let [r_dx, r_dy] = getDirection(from, [cx, cy]); 
      let t2 = (r_dx*(s_py-r_py) + r_dy*(r_px-s_px))/(s_dx*r_dy - s_dy*r_dx)
      let ta = (s_px+s_dx*t2-r_px)/r_dx;
      if (Number.isNaN(ta)) return 0; // ray is directly on the segment?
      if (ta < 0) ta = Infinity; // Point is behind us
      return ta;
    }
  }

  function getDirection(from, to) {
    let dir = [to[0] - from[0], to[1] - from[1]];
    let l = Math.sqrt(dir[0]*dir[0] + dir[1] * dir[1]);
    if (l < 1e-3) return;
    dir[0] /= l; dir[1] /= l;
    return dir;
  }

  function getMostVisibleNeighbors(eye, lookDirection, maxCount, maxAngle) {
    if (!lookDirection) return []; // looking down?

    // not only we find N nearest boxes, we also filter them so that
    // only those in front of the camera are selected
    return knn(spatialIndex, eye[0], eye[1], maxCount, checkAngle);

    function checkAngle(candidate) {
      let x = (candidate.minX + candidate.maxX)/2;
      let y = (candidate.minY + candidate.maxY)/2;
      let candidateDirection = getDirection(eye, [x, y])
      if (!candidateDirection) return false;

      // We take a dot product of two unit vectors which is equal to
      // the cosine of angle between them. This lets us measure angle
      // between the vector where camera looks and where the candidate is.
      // If that angle is too big - we ignore the candidate.

      let dot = lookDirection[0] * candidateDirection[0] + lookDirection[1] * candidateDirection[1];
      let angle = Math.acos(dot); // no need to divide, as we are normalized
      return angle < maxAngle * Math.PI / 180;
    }
  }
}

function smoothStep(min, max, value) {
  var x = Math.max(0, Math.min(1, (value-min)/(max-min)));
  return x*x*(3 - 2*x);
}

function normalize(out, a) {
  let x = a[0];
  let y = a[1];
  let z = a[2];
  let len = x * x + y * y + z * z;
  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
  }
  out[0] = a[0] * len;
  out[1] = a[1] * len;
  out[2] = a[2] * len;
  return out;
}