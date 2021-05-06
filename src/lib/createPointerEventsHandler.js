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
  const scene = sceneLayerManager.getScene();

  scene.on('click', handleClick);
  scene.on('mousemove', handleMove);
  scene.on('transform', handleTransform);

  const highlightedNodes = new PointCollection(scene.getGL());
  const firstLevelArrows = new LineCollection(scene.getGL(), {width: 60});
  const secondLevelArrows = new LineCollection(scene.getGL(), {width: 20});

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
    }
  }

  function handleTransform(e) {
    let cameraZPosition = e.drawContext.view.position[2];
    let z = Math.min(cameraZPosition, 8000);
    firstLevelArrows.width = Math.max(1, 60 * z / 8000);
    secondLevelArrows.width = Math.max(1, 20 * z / 8000);
    moved = true;
    if (options && options.onTransform) options.onTransform();
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