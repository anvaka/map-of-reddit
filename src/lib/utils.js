
export function debounce(cb, ms, self) {
  let lastCall = new Date();
  let handle;

  return function() {
    let time = new Date();
    let elapsed = time - lastCall;
    clearTimeout(handle);
    if (elapsed > ms) {
      cb.apply(self, arguments)
    } else {
      lastCall = time;
      const args = arguments;
      handle = setTimeout(function() {
        cb.apply(self, args);
      }, ms)
    }
  }
}

export function formatNumber(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}