
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
      handle = setTimeout(cb, ms, arguments)
    }
  }
}

export function formatNumber(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}