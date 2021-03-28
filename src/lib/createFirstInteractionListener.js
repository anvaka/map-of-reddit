export default function createFirstInteractionListener(callback) {
  window.addEventListener('mousedown', handleFirstEvent, true);
  window.addEventListener('wheel', handleFirstEvent, true);
  window.addEventListener('touchstart', handleFirstEvent, true);
  window.addEventListener('keydown', handleFirstEvent, true);

  let called = false;

  return dispose;

  function handleFirstEvent() {
    if (called) return;
    called = true;
    callback();
  }

  function dispose() {
    window.removeEventListener('mousedown', handleFirstEvent, true);
    window.removeEventListener('wheel', handleFirstEvent, true);
    window.removeEventListener('touchstart', handleFirstEvent, true);
    window.removeEventListener('keydown', handleFirstEvent, true);
  }
}