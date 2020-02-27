export function rafDebounce (func, execAsap) {
  let timeout;

  return function debounced() {
    let obj = this, args = arguments;

    function delayed() {
      if (!execAsap) {
        func.apply(obj, args);
      }
      timeout = null;
    };

    if (timeout) {
      cancelAnimationFrame(timeout);
    } else if (execAsap) {
      func.apply(obj, args);
    }

    timeout = requestAnimationFrame(delayed);
  };
}