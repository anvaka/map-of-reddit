let qs = require('query-state')
let state = qs.instance({}, {useSearch: true})
let pendingSave;
let versionToLink = {
  1: 'https://anvaka.github.io/map-of-reddit-data/graph.svg',
  2: 'https://anvaka.github.io/map-of-reddit-data/v2/graph.svg',
  3: 'https://anvaka.github.io/map-of-reddit-data/v3/graph.svg',
  // 4: 'http://127.0.0.1:8080/graph.svg',
};

let lastVersion = 2;
let latestGraphLink = versionToLink[lastVersion];
// we should ignore camera position if user doesn't have graph version in the link
// it means they have stored previous link, and we have changed the graph, so their
// link wouldn't work correctly.
let versionMissing = state.get('v') === undefined;
let graphDefined = state.get('graph') !== undefined;

export default {
  query: state.get('q') || '',
  userTypedSomething: false,

  getFilePath() {
    const version = state.get('v')
    return state.get('graph') || versionToLink[version] || latestGraphLink;
  },
  saveQuery(newQuery) {
    // make sure we store the version in all new calls:
    if (newQuery) {
      const newState = {q: newQuery};
      state.set(newState);
    } else {
      state.unset('q');
    }
  },
  getQueryState() {
    return state;
  },
  getCameraPosition() {
    if (versionMissing && !graphDefined) return;
    let coordinates = ['x', 'y', 'z'].map(name => {
      let v = Number.parseFloat(state.get(name));
      if (Number.isFinite(v)) return v;
    }).filter(x => x !== undefined);
    if (coordinates.length === 3) return coordinates;
  },
  saveScenePosition(scene) {
    if (pendingSave) {
      clearTimeout(pendingSave);
      pendingSave = 0;
    }

    pendingSave = setTimeout(() => {
      pendingSave = 0;
      let dc = scene.getDrawContext();
      let [x, y, z] = dc.view.position;
      let position = {x, y, z}

      if (versionMissing && !graphDefined) {
        position.v = lastVersion;
      }
      state.set(position);
    }, 300);
  }
}