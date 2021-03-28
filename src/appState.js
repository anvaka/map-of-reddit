let qs = require('query-state')
let state = qs.instance({}, {useSearch: true})
let pendingSave;

export default {
  query: state.get('q') || '',
  userTypedSomething: false,

  getFilePath() {
    return state.get('graph') || 'https://anvaka.github.io/map-of-reddit-data/graph.svg';
  },
  saveQuery(newQuery) {
    if (newQuery) {
      state.set({q: newQuery});
    } else {
      state.unset('q');
    }
  },
  getQueryState() {
    return state;
  },
  getCameraPosition() {
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
      state.set(position);
    }, 300);
  }
}