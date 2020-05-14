import { h, hydrate } from '../web_modules/preact.js';
import App from '../components/App.js';

function loadScript(src, done) {
  var js = document.createElement('script');
  js.src = src;
  js.onload = function() {
    done();
  };
  js.onerror = function() {
    done(new Error('Failed to load script ' + src));
  };
  document.head.appendChild(js);
}

function main() {

  if (!HTMLCanvasElement.prototype.toBlob) {
    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
      value: function (callback, type, quality) {
        var canvas = this;
        setTimeout(function() {

          var binStr = atob( canvas.toDataURL(type, quality).split(',')[1] ),
              len = binStr.length,
              arr = new Uint8Array(len);

          for (var i = 0; i < len; i++ ) {
            arr[i] = binStr.charCodeAt(i);
          }

          callback( new Blob( [arr], {type: type || 'image/png'} ) );

        });
      }
    });
  }

  hydrate(
    h(App, Object.assign(
      { url: location.pathname },
      window.state
    )),
    document.querySelector('.root')
  );

}

if (!('IntersectionObserver' in window)) {
  loadScript(
    'https://unpkg.com/intersection-observer@0.7.0/intersection-observer.js',
    main
  );
}
else {
  main();
}

