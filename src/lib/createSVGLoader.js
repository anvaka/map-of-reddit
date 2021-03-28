import eventify from 'ngraph.events';
import createGraph from 'ngraph.graph';
import {createStreamingSVGParser} from 'streaming-svg-parser';
import {setProgress} from './bus';
import {formatNumber} from './utils';

export default function createSVGLoader(url) {
  let disposed = false;
  let graph = createGraph();
  let parseSVGAsync = createStreamingSVGParser(notifyTagOpen, notifyTagClose, true)

  let api = eventify({load, dispose, getGraph() { return graph; }});
  return api;

  function dispose() {
    disposed = true;
  }

  function load() {
    let start = window.performance.now();
    fetch(url, {mode: 'cors'}).then(response => {
      let fetchReader = response.body.getReader();
      let decoder = new TextDecoder();

      return fetchReader.read().then(processData);

      function processData(progress) {
        if (disposed) return;

        let chunk = (progress.value !== undefined && decoder.decode(progress.value, {stream: !progress.done})) || '';
        return parseSVGAsync(chunk).then(() => {
          if(progress.done) {
            return;
          }
          return fetchReader.read().then(processData);
        });
      }
    }).then(() => {
      console.log('Elapsed: ', window.performance.now() - start);
      setProgress(() => ({
        message: 'Loading links...'
      }));
      // now the svg file is loaded. Let's load secondary information
      return fetch(getPathTo('node-ids.txt'), {mode: 'cors'}).then(response => response.text()).then(txt => {
        let labels = txt.split('\n');
        labels.forEach(label => graph.addNode(label));
        return labels;
      });
    }).then((labels) => {
      // now load the edges:
      let fromId, fetchReader, prevBuffer, weight;
      return fetch(getPathTo('links.bin'), {mode: 'cors'})
      .then(response => {
        fetchReader = response.body.getReader();
        return fetchReader.read().then(processData);
      });

      function processData(progress) {
        if (disposed) return;

        let chunk = progress.value;
        if (!chunk && prevBuffer) {
          throw new Error('Incomplete response');
        }
        if (!chunk) {
          setProgress(() => ({
            mapLoaded: true,
          }));
          return graph;
        }

        if (prevBuffer) {
          let tmp = new Uint8Array(prevBuffer.byteLength + chunk.byteLength);
          tmp.set(new Uint8Array(prevBuffer), 0);
          tmp.set(new Uint8Array(chunk), prevBuffer.byteLength);
          chunk = tmp;
          prevBuffer = null;
        }
        let lastAvailableByte = Math.floor(chunk.byteLength / 4) * 4;
        if (chunk.byteLength % 4 !== 0) {
          prevBuffer = chunk.slice(lastAvailableByte);
        }
        const view = new DataView(chunk.buffer);
        for (let i = 0; i < lastAvailableByte; i += 4) {
          let linkId = view.getInt32(i, /* little endian = */ true);
          if (linkId < 0) {
            fromId = -linkId - 1;
            weight = 1;
            graph.addNode(labels[fromId]);
          } else {
            let toId = linkId - 1;
            graph.addLink(labels[fromId], labels[toId], weight)
            weight += 1;
          }
        }

        if (progress.done) {
          setProgress(() => ({
            mapLoaded: true
          }));
          return graph;
        }
        setProgress(getLinksCount);
        return fetchReader.read().then(processData);
      }
    });

    function getLinksCount() {
      return {
        message: 'Loaded ' + formatNumber(graph.getLinkCount()) + ' relationship records'
      }
    }

    function getPathTo(name) {
      if (url.indexOf('http') < 0) return name;
      let baseUrl = new URL(url);
      baseUrl.pathname = baseUrl.pathname.substr(0, baseUrl.pathname.lastIndexOf('/') + 1) + name;
      return baseUrl.toString();
    }

    return api;
  }

  function notifyTagOpen(element) {
    api.fire('element-start', element);
  }

  function notifyTagClose(element) {
    api.fire('element-end', element)
  }

}