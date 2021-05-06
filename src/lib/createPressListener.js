export default function createPressListener(el, handler, repeatFrequency = 15) {
  let handle;
  el.addEventListener('mousedown', onDown);
  el.addEventListener('touchstart', onDown);
  el.addEventListener('keydown', onKeyDown);
  el.addEventListener('keyup', onKeyUp);

  return dispose;

  function dispose() {
    el.removeEventListener('mousedown', onDown);
    el.removeEventListener('touchstart', onDown);
    el.removeEventListener('keydown', onKeyDown);
    el.removeEventListener('keyup', onKeyUp);

    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('touchend', onTouchEnd);
    document.removeEventListener('touchcancel', onTouchEnd);
    clearTimeout(handle);
  }

  function onDown(e) {
    e.preventDefault();
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchcancel', onTouchEnd);
    processLoop();
  }

  function processLoop() {
    handler(1);
    handle = setTimeout(processLoop, repeatFrequency);
  }

  function onMouseUp() {
    stopLoop();
  }

  function onKeyDown(e) {
    if(e.which === 13) { // return
      handler(1); e.preventDefault();
    }
  }
  function onKeyUp(e) {
    if(e.which === 13) { // return
      handler(0); e.preventDefault();
    }
  }

  function onTouchEnd() {
    stopLoop();
  }

  function stopLoop() {
    clearTimeout(handle);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('touchend', onTouchEnd);
    document.removeEventListener('touchcancel', onTouchEnd);
    handler(0);
  }
}