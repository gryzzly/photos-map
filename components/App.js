import htm from '../web_modules/htm.js';
import { h, Component } from '../web_modules/preact.js';
const html = htm.bind(h);

import Map from './Map.js';
import Contents from "./Contents.js";

function isInViewport (bounding, scrollTop) {
  return (
    bounding.top - scrollTop >= 0
  );
}

const TRIANGLE_PADDING = 3;

export default class App extends Component {
  constructor(props) {
    super();
    this.imagePositions = {};
    this.imagesCount =
        props.images[Object.keys(props.images)[0]].length;
    this.state = {
      scrollOffset: 0,
      leftTopX: 0,
      leftTopY: 0,
      leftBottomX: 0,
      leftBottomY: 0,
      rightX: 0,
      rightY: 0,
      currentImage: '',
      markerPositions: {},
    };

    [
      'onMapCollectionClick',
      'setImagePositions',
      'setMarkerPositions',
      'updateScrollOffset'
    ].forEach(function(fn) {
      this[fn] = this[fn].bind(this);
    }, this);
  }

  onMapCollectionClick(collection) {
    window.location = `/${collection}/index.html`
  }

  setImagePositions(path, rect) {
    this.imagePositions[path] = rect;
  }

  setMarkerPositions(markers) {
    this.setState({
      markerPositions: markers,
      ...this.getTriangleCoordinates(),
    });
  }

  updateScrollOffset(scrollTop) {
    const itemInViewport = (function(positions, scrollOffset) {
      let item;
      Object.keys(positions).some(element => {
        const inViewport = isInViewport(
          positions[element],
          scrollOffset
        );
        if (inViewport) {
          item = element;
          return true;
        }
      });
      return item;
    } (this.imagePositions, scrollTop));

    this.setState({
      scrollOffset: scrollTop,
      currentImage: itemInViewport
    }, () => {
      this.setState(this.getTriangleCoordinates());
    });
  };

  getTriangleCoordinates() {
    const {
      currentImage,
      scrollOffset,
      markerPositions,
    } = this.state;

    if (!currentImage) {
      return;
    }

    const image = this.imagePositions[currentImage];
    const marker = markerPositions[currentImage];

    return {
      leftTopX: image.right,
      leftTopY: image.top - scrollOffset + TRIANGLE_PADDING,
      leftBottomX: image.right,
      leftBottomY: image.bottom - scrollOffset - TRIANGLE_PADDING,
      rightX: marker.x,
      rightY: marker.y
    };
  }

  render(props, state) {
    const {
      leftTopX,
      leftTopY,
      leftBottomX,
      leftBottomY,
      rightX,
      rightY,
      currentImage,
    } = state;

    return html`<main>
      <${Map}
        imagesByCollection=${props.images}
        onCollectionClick=${this.onMapCollectionClick}
        images=${props.images}
        url=${props.url}
        onMount=${this.setMarkerPositions}
      />
      <${Contents} 
        ...${props} 
        onMount=${this.setImagePositions}
        onScroll=${this.updateScrollOffset}
      />
      <svg
        class="svg-canvas"
        visibility="${
          Boolean(currentImage)
            ? 'visible'
            : 'hidden'
        }"
       >
        <line
          x1="${leftTopX}"
          y1="${leftTopY}"
          x2="${rightX}"
          y2="${rightY}"
        />
        <line
          x1="${leftBottomX}"
          y1="${leftBottomY}"
          x2="${rightX}"
          y2="${rightY}"
         />
      </svg>
    </main>`;
  }
}
