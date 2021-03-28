const fuzzysort = require('fuzzysort')

export default function createFuzzySearcher() {
  let words = [];
  let api = {
    addWord,
    find
  }

  return api;

  function addWord(word) {
    words.push(word);
  }

  function find(query) {
    let promise = fuzzysort.goAsync(query, words, {limit: 10})

    return promise.then(results => {
      return results.map(x => ({
        html: fuzzysort.highlight(x, '<b>', '</b>'),
        text: x.target
      }));
    }); 
    // if(invalidated) promise.cancel()
  }
}