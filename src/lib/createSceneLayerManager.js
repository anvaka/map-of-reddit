export default function createSceneLayerManager(scene) {
  // Allows clients to hide/restore multiple elements at once:
  const namedGroups = new Map(); // string -> {elements: Element[], isHidden: Boolean}

  return {
    addToLayer,
    addToNamedGroup,
    hideNamedGroup,
    restoreNamedGroup,
    getNamedGroup: (groupName) => namedGroups.get(groupName),
    getScene: () => scene
  };

  function restoreNamedGroup(groupName) {
    let group = namedGroups.get(groupName);
    if (group === undefined) throw new Error('No such group: ' + groupName);
    if (!group.isHidden) return; // already restored
    group.isHidden = false;
    group.elements.forEach(element => {
      // put it back to the previous z-index
      addToLayer(element, element.layer);
    });
  }

  function addToNamedGroup(element, groupName) {
    let group = namedGroups.get(groupName);
    if (group === undefined) {
      group = {
        elements: [],
        isHidden: false
      }
      namedGroups.set(groupName, group);
    }
    // Note: it's your responsibility to avoid duplicates
    group.elements.push(element);
  }

  function hideNamedGroup(groupName) {
    let group = namedGroups.get(groupName);
    if (!group) {
      throw new Error('No group with such name: ' + groupName);
    }

    if (group.isHidden) return; // already hidden;
    group.isHidden = true;
    group.elements.forEach(element => {
      if (element.parent) element.parent.removeChild(element);
    });
  }

  function addToLayer(element, layerIndex) {
    element.layer = layerIndex
    let rootElement = scene.getRoot();
    let lastElementWithLowerLayerIndex = null;
    rootElement.children.forEach(el => {
      let layer = el.layer;
      if (layer === undefined) {
        // z-index may not be correct!
        console.warn('Scene element without layer index', layer);
        layer = 0;
      }
      if (layer <= layerIndex) {
        lastElementWithLowerLayerIndex = el;
      }
    });
    if (lastElementWithLowerLayerIndex) {
      rootElement.insertChildAfter(element, lastElementWithLowerLayerIndex);
    } else {
      // none of the existing layers is lower than our own layer index,
      // send us to the very back:
      rootElement.appendChild(element, /* sendToBack */ true);
    }
  }
}