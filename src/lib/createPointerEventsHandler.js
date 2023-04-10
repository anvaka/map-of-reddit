/**
 * This class is responsible for finding nodes under cursor
 */
import RBush from 'rbush';
import knn from 'rbush-knn';
import bus from './bus';
import LineCollection from './LineCollection';
import PointCollection from './PointCollection';
import {LayerLevels} from './constants';

export default function createPointerEventsHandler(sceneLayerManager, options) {
  const spatialIndex = new RBush();
  let moved = false;
  let isPaused = false;
  let maxCameraDistance = 8000;
  const scene = sceneLayerManager.getScene();

  scene.on('click', handleClick);
  scene.on('mousemove', handleMove);
  scene.on('transform', handleTransform);

  const highlightedNodes = new PointCollection(scene.getGL());
  let primaryWidth = getPrimaryLineWidth(scene.getDrawContext().view.position[2]);
  const firstLevelArrows = new LineCollection(scene.getGL(), {width: primaryWidth});
  const secondLevelArrows = new LineCollection(scene.getGL(), {width: primaryWidth/2});

  sceneLayerManager.addToLayer(secondLevelArrows, LayerLevels.Edges);
  sceneLayerManager.addToLayer(firstLevelArrows, LayerLevels.HighlightedEdges);
  sceneLayerManager.addToLayer(highlightedNodes, LayerLevels.Nodes);

  if (options.elementsGroupName) {
    sceneLayerManager.addToNamedGroup(firstLevelArrows, options.elementsGroupName);
    sceneLayerManager.addToNamedGroup(secondLevelArrows, options.elementsGroupName);
    sceneLayerManager.addToNamedGroup(highlightedNodes, options.elementsGroupName);
  }

  return {
    addNode,
    clearHighlights,
    focusUI,
    dispose,
    setPaused,
    getIndex() {
      return spatialIndex;
    },
    setViewBox
  }

  function setViewBox(newBox) {
    maxCameraDistance = Math.max(newBox.width, newBox.height);
  }

  function handleTransform(e) {
    let cameraZPosition = e.drawContext.view.position[2];
    firstLevelArrows.width = getPrimaryLineWidth(cameraZPosition);
    secondLevelArrows.width = firstLevelArrows.width / 2;
    moved = true;
    if (options && options.onTransform) options.onTransform();
  }

  function getPrimaryLineWidth(cameraZPosition) {
    const k = cameraZPosition / maxCameraDistance;
    let pixelWidth = 6 - 2 * k;
    if (k < 0) pixelWidth = 5;
    if (k > 2) pixelWidth = Math.log(k) / Math.log(2) + 1;
    return getSceneWidthForPixelWidth(pixelWidth/8)
  }

  function getSceneWidthForPixelWidth(pixelWidth) {
    let dc = scene.getDrawContext();
    let top = scene.getSceneCoordinate(dc.width / 2, dc.height / 2 - pixelWidth / 2);
    let bottom = scene.getSceneCoordinate(dc.width / 2, dc.height / 2 + pixelWidth / 2);
    return Math.abs(top[1] - bottom[1]);
  }

  function clearHighlights() {
    firstLevelArrows.clear();
    secondLevelArrows.clear();
    highlightedNodes.clear();
  }

  function focusUI(ui) {
    if (ui !== undefined) {
      bus.fire('show-subreddit', ui.name);
    }
    let graph = options && options.getGraph && options.getGraph();
    if (!ui && !moved && graph) {
      clearHighlights();
      bus.fire('show-subreddit', null);
      scene.renderFrame();
    }

    moved = false;

    if (ui) {
      clearHighlights();

      options.getHighlightedLinks(ui).forEach(linkUI => {
        let links = linkUI.isFirstLevel ? firstLevelArrows : secondLevelArrows;
        links.add(linkUI);
      });
      options.getHighlightedNodes(ui).forEach(nodeUI => highlightedNodes.add(nodeUI));

      scene.renderFrame();
    } 
  }

  function addNode(ui) {
    let position = ui.position;
    let r = ui.size / 2;

    spatialIndex.insert({
      minX: position[0] - r,
      minY: position[1] - r,
      maxX: position[0] + r,
      maxY: position[1] + r,
      ui,
    });
  }

  function dispose() {
    scene.removeChild(firstLevelArrows);
    scene.removeChild(secondLevelArrows);
    scene.removeChild(highlightedNodes);

    scene.off('click', handleClick);
    scene.off('mousemove', handleMove);
    scene.off('transform', handleTransform);
  }

  function handleClick(e) {
    let ui = findNearest(e.x, e.y);
    focusUI(ui);
  }

  function setPaused(newIsPaused) {
    isPaused = newIsPaused;
  }

  function handleMove(e) {
    if (isPaused) return;

    let ui = findNearest(e.x, e.y);
    if (ui !== undefined) {
      bus.fire('show-tooltip', {
        x: e.originalEvent.clientX,
        y: e.originalEvent.clientY,
        data: ui.name,
      });
      return;
    }

    bus.fire('show-tooltip', null);
  }

  function findNearest(x, y) {
    const neighborIds = knn(spatialIndex, x, y, 1);
    let neighbor = neighborIds[0];
    if (neighbor === undefined) return;
    let ui = neighbor.ui;

    let [uiX, uiY] = ui.position;
    let dist = Math.hypot(x - uiX, y - uiY);
    if (dist < ui.size / 2) return ui;
  }
}