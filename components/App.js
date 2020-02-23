import htm from '../web_modules/htm.js';
import { h, Component } from '../web_modules/preact.js';
const html = htm.bind(h);

import Map from './Map.js';
import Contents from "./Contents.js";

function isInViewport (bounding, scrollTop) {
  return (
    bounding.top - scrollTop >= 0
  );
};

function clearLines() {
  const svg = document.querySelector('.svg-canvas');
  svg.innerHTML = '';
}

function drawSvgLine(x1, y1, y21, x2, y2) {
  const svg = document.querySelector('.svg-canvas');
  svg.innerHTML = '';
  const line = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line"
  );
  line.setAttribute('stroke', '#ccc');
  line.setAttribute('stroke-width', '1px');
  // line.setAttribute('stroke-dasharray', 4);
  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1 + 1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);

  const line2 = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line"
  );
  line2.setAttribute('stroke', '#ccc');
  line2.setAttribute('stroke-width', '1px');
  // line2.setAttribute('stroke-dasharray', 5);
  line2.setAttribute('x1', x1);
  line2.setAttribute('y1', y21 - 1);
  line2.setAttribute('x2', x2);
  line2.setAttribute('y2', y2);

  svg.appendChild(line);
  svg.appendChild(line2);
}

export default class App extends Component {
  positions = {};
  markerPositions = {};
  scrollOffset = 0;

  onMapCollectionClick = (collection) => {
    window.location = `/${collection}/index.html`
  };

  setupTriangles = (path, rect) => {
    this.positions[path] = rect;
  };

  setupMarkers = (markers) => {
    this.markerPositions = markers;
    console.log('setupMarkers');
    this.drawLine();
  };

  updateScrollOffset = (scrollTop) => {
    this.scrollOffset = scrollTop;
    console.log('updateScrollOffset');
    this.drawLine();
  };

  drawLine = () => {
    if (
      Object.keys(this.positions).length ===
      this.props.images[Object.keys(this.props.images)[0]].length
    ) {
      let key;
      Object.keys(this.positions).some(element => {
        const inViewport = isInViewport(
          this.positions[element],
          this.scrollOffset
        );
        if (inViewport) {
          key = element;
          return true;
        }
      });

      if (key) {
        drawSvgLine(
          this.positions[key].right,
          this.positions[key].top - this.scrollOffset,
          // this.positions[key].bottom - this.scrollOffset - (this.positions[key].height / 2),
          this.positions[key].bottom - this.scrollOffset,
          this.markerPositions[key].x,
          this.markerPositions[key].y
        );
      } else {
        clearLines();
      }

    }
  }

  render(props, state) {
    return html`<main>
      <${Map}
        imagesByCollection=${props.images}
        onCollectionClick=${this.onMapCollectionClick}
        images=${props.images}
        url=${props.url}
        onMount=${this.setupMarkers}
      />
      <${Contents} 
        ...${props} 
        onMount=${this.setupTriangles}
        onScroll=${this.updateScrollOffset} 
      />
    </main>`;
  }
}
