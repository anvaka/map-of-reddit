const fuzzysort = require('fuzzysort')

export default function createFuzzySearcher() {
  let words = [];
  let lastPromise;
  let api = {
    addWord,
    find
  }

  return api;

  function addWord(word) {
    words.push(word);
  }

  function find(query) {
    if (lastPromise) {
      lastPromise.cancel();
    }
    lastPromise = fuzzysort.goAsync(query, words, {limit: 10})

    return lastPromise.then(results => {
      return results.map(x => ({
        html: fuzzysort.highlight(x, '<b>', '</b>'),
        text: x.target
      }));
    }); 
    // if(invalidated) promise.cancel()
  }
}