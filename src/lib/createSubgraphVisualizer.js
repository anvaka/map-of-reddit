import PointCollection from './PointCollection';
import TextCollection from './MSDFTextCollection';
import {Colors, LayerLevels, NamedGroups} from './constants';
import createPointerEventsHandler from './createPointerEventsHandler';
import bus, {setProgress} from './bus';

const createLayout = require('ngraph.forcelayout');

const Easing = {
  easeInQuart(x) {
    return x * x * x * x;
  }
}

export default function createSubgraphVisualizer(subgraph, viewBox, sceneLayerManager, nodeNameToUI) {
  let layout;
  let raf;
  let MAX_FRAMES = 400;
  let renderCount = 0;

  const ourNodeNameToUI = new Map();
  const scene = sceneLayerManager.getScene();
  const points = new PointCollection(scene.getGL());
  const text = new TextCollection(scene.getGL());
  const transitionAnimator = createTransitionAnimator(sceneLayerManager, 60 * 0.2, viewBox);

  // order is important. Pointer events should go after main elements
  sceneLayerManager.addToLayer(points, LayerLevels.Nodes);
  sceneLayerManager.addToLayer(text, LayerLevels.Text);

  // Now we are going to listen to events from the subgraph:
  let pointerEvents = createPointerEventsHandler(sceneLayerManager, {
    getGraph: () => renderCount < MAX_FRAMES && subgraph,
    getHighlightedLinks,
    getHighlightedNodes
  });
  bus.on('subgraph-focus-node', focusSubgraphNode);

  return {
    dispose,
    getPointerEvents() {
      return pointerEvents
    },
    getNameToUI() {
      return ourNodeNameToUI
    },
    run
  };


  function focusSubgraphNode(name) {
    pointerEvents.focusUI(ourNodeNameToUI.get(name));
  }

  function getHighlightedNodes(ui) {
    const hlNode = {...ourNodeNameToUI.get(ui.name)};
    hlNode.color = Colors.PRIMARY_HIGHLIGHT_COLOR ;
    let nodeUIs = [hlNode];
    subgraph.forEachLinkedNode(ui.name, (other) => {
      const hlNode = {...ourNodeNameToUI.get(other.id)};
      hlNode.color = Colors.SECONDARY_HIGHLIGHT_COLOR;
      nodeUIs.push(hlNode);
    });

    return nodeUIs;
  }

  function getHighlightedLinks(ui) {
    let linkUIs = [];

    subgraph.forEachLink(link => {
      let isFirstLevel = (link.fromId === ui.name || link.toId === ui.name);
      linkUIs.push({
        from: ourNodeNameToUI.get(link.fromId).position,
        to: ourNodeNameToUI.get(link.toId).position,
        color: isFirstLevel ? 0xffffffff : Colors.TERNARY_LINK, 
        isFirstLevel
      });
    });

    return linkUIs;
  }

  function dispose(onSceneIsBack) {
    cancelAnimationFrame(raf);
    bus.off('subgraph-focus-node', focusSubgraphNode);

    text.parent.removeChild(text);
    text.dispose();

    pointerEvents.dispose();

    transitionAnimator.startSceneRestoration(() => {
      points.parent.removeChild(points);
      points.dispose();
      if (onSceneIsBack) onSceneIsBack();
    }, ourNodeNameToUI, nodeNameToUI, points, onSceneIsBack === undefined);
    raf = null;
    scene.renderFrame();
  }

  function run() {
    transitionAnimator.startFadeOut();
    beginLayout();
    // transitionAnimator.startZoomOut(beginLayout);
  }

  function beginLayout() {
    layout = createLayout(subgraph, {
      timeStep: 80,
      springLength: 5000,
      springCoefficient: 1e-5,
      gravity: -120,
      nodeMass(nodeId) {
        let ui = nodeNameToUI.get(nodeId);
        return ui.size * Math.sqrt(ui.size);
      }
    });

    rememberAndSetOriginalPositions();
    // transitionAnimator.startZoomIn(getBoundingRect(), () => {
    // });
    raf = requestAnimationFrame(frame);
  }

  function frame() {
    for (let i = 0; i < 10; ++i) layout.step();

    updateNodePositions();

    if (renderCount++ < MAX_FRAMES) {
      raf = requestAnimationFrame(frame);
      if (renderCount % 10 === 0) {
        setProgress(() => ({
          message: `Layout step ${renderCount} of ${MAX_FRAMES}. Please wait...`
        }));
      }
    } else {
      finishRendering();
    }

    scene.setViewBox(getBoundingRect());

    scene.renderFrame();
  }

  function getRootNodeId() {
    let root = null;
    subgraph.forEachNode(node => {
      if (node.data && node.data.isRoot) {
        root = node.id;
        return true;
      }
    });
    if (!root) {
      throw new Error('Root node is missing in the subgraph');
    }
    return root;
  }

  function finishRendering() {
    subgraph.forEachNode(node => {
      let {x, y} = layout.getNodePosition(node.id);
      let ui = ourNodeNameToUI.get(node.id);
      pointerEvents.addNode(ui);
      text.addText({
        x,
        y: y - ui.size * 0.75,
        text: ui.name,
        limit: 2. * ui.size,
        cx: 0.5,
      });
    });

    let rootNode = getRootNodeId();
    pointerEvents.focusUI(ourNodeNameToUI.get(rootNode));
    setProgress(() => ({
      subgraphDone: true,
      subgraphName: rootNode
    }))
    // transitionAnimator.startZoomIn(boundingRect);
  }

  function getBoundingRect() {
    let boundingRect = {
      left: Infinity,
      right: -Infinity,
      top: Infinity,
      bottom: -Infinity
    }
    subgraph.forEachNode(node => {
      let {x, y} = layout.getNodePosition(node.id);
      if (x < boundingRect.left) boundingRect.left = x;
      if (x > boundingRect.right) boundingRect.right = x;
      if (y < boundingRect.top) boundingRect.top = y;
      if (y > boundingRect.bottom) boundingRect.bottom = y;
    });
    return boundingRect;
  }

  function updateNodePositions() {
    subgraph.forEachNode(node => {
      let pos = layout.getNodePosition(node.id);
      let ui = ourNodeNameToUI.get(node.id);
      ui.position[0] = pos.x;
      ui.position[1] = pos.y;
      points.update(ui.id, ui);
    });
  }

  function rememberAndSetOriginalPositions() {
    subgraph.forEachNode(node => {
      let ui = nodeNameToUI.get(node.id);
      if (!ui) throw new Error('Missing ui for node: ' + node.id);
      // let isRoot = node.data && node.data.isRoot;
      let pos = copyPosition(ui.position);
      let color = Colors.TERNARY_COLOR;
      // if (isRoot) color = Colors.PRIMARY_HIGHLIGHT_COLOR;
      // else if (node.data && node.data.isFirstChild) color = Colors.SECONDARY_HIGHLIGHT_COLOR;

      let ourUI = {
        position: pos,
        color,
        size: ui.size,
        id: ourNodeNameToUI.size,
        name: ui.name,
      };
      ourNodeNameToUI.set(ui.name, ourUI);
      points.add(ourUI);
      layout.setNodePosition(node.id, pos[0], pos[1])
    });
  }

}

function createTransitionAnimator(sceneLayerManager, durationInFrames, zoomOutViewBox) {
  let elapsed = 0;
  let raf;
  let currentStep;
  let zoomStart, zoomEnd, changeRectangleFinishedCallback;
  let doneCallback;
  let positions, nodeUIs;
  const scene = sceneLayerManager.getScene();

  return {
    startZoomOut,
    startZoomIn,
    startFadeOut,
    startSceneRestoration,
    dispose() {
      cancelAnimationFrame(raf);
    }
  }

  function startZoomOut(cb) {
    elapsed = 0;
    zoomStart = getCurrentBoundingRectangle();
    let {width, height, top, left} = zoomOutViewBox;
    zoomEnd = {
      top, 
      left,
      right: left + width,
      bottom: top + height
    };

    currentStep = changeRectangle;
    changeRectangleFinishedCallback = () => {
      startFadeOut();
      cb();
    };

    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  function startZoomIn(boundingRect, doneCallback) {
    currentStep = changeRectangle;
    elapsed = 0;
    zoomStart = getCurrentBoundingRectangle();
    zoomEnd = boundingRect;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
    changeRectangleFinishedCallback = null;
    if (doneCallback) {
      changeRectangleFinishedCallback = doneCallback;
    }
  }

  function getCurrentBoundingRectangle() {
    let dc = scene.getDrawContext();
    const {position} = dc.view;
    let side = position[2] * Math.tan(dc.fov / 2) / dc.pixelRatio;
    return {
      left: position[0] - side, 
      right: position[0] + side, 
      top: position[1] - side, 
      bottom: position[1] + side
    };
  }

  function startFadeOut() {
    sceneLayerManager.getNamedGroup(NamedGroups.MainGraph).elements.forEach(el => {
      el.opacity = 0;
    });
    sceneLayerManager.hideNamedGroup(NamedGroups.MainGraph);
  }

  function startSceneRestoration(done, current, target, nodeCollections, immediate) {
    if (immediate) {
      // TODO: this is ugly. Please refactor.
      sceneLayerManager.restoreNamedGroup(NamedGroups.MainGraph);
      sceneLayerManager.getNamedGroup(NamedGroups.MainGraph).elements.forEach(el => {
        el.opacity = 1;
      });
      done();
      return;
    }
    elapsed = 0;
    currentStep = fadeIn;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
    doneCallback = done;

    nodeUIs = nodeCollections;
    positions = [];
    current.forEach((ui, name) => {
      positions.push({
        ui,
        from: copyPosition(ui.position),
        to: target.get(name).position
      });
    })
  }

  function frame() {
    if (elapsed >= durationInFrames) {
      elapsed = durationInFrames;
      currentStep(1);
      return;
    } 

    raf = requestAnimationFrame(frame);
    currentStep(elapsed / durationInFrames);
    elapsed += 1;
  }

  function changeRectangle(x) {
    if (x === 1) {
      if (changeRectangleFinishedCallback) changeRectangleFinishedCallback();
      changeRectangleFinishedCallback = null;
      return;
    }

    scene.setViewBox({
      top: lerp(zoomStart.top, zoomEnd.top, x),
      left: lerp(zoomStart.left, zoomEnd.left, x),
      right: lerp(zoomStart.right, zoomEnd.right, x),
      bottom: lerp(zoomStart.bottom, zoomEnd.bottom, x)
    });
    scene.renderFrame();
  }

  function lerp(from, to, t) {
    return to * t + from * (1 - t);
  }

  function fadeIn(x) {
    if (x === 0) {
      // we we just start - let's bring back all nodes from original scene
      // Their opacity is 0.
      sceneLayerManager.restoreNamedGroup(NamedGroups.MainGraph);
    }
    // we will be changing opacity back to normal:
    let opacity = Easing.easeInQuart(x);
    sceneLayerManager.getNamedGroup(NamedGroups.MainGraph).elements.forEach(el => {
      el.opacity = opacity;
    });
    positions.forEach(node => {
      let ui = node.ui;
      ui.position[0] = lerp(node.from[0], node.to[0], x);
      ui.position[1] = lerp(node.from[1], node.to[1], x);
      nodeUIs.update(ui.id, ui);
    });
    sceneLayerManager.getScene().renderFrame();

    if (x === 1 && doneCallback) {
      // all is done, let's notify the client
      doneCallback();
    }
  }
}

function copyPosition(pos) {
  return [pos[0], pos[1], pos[2]];
}