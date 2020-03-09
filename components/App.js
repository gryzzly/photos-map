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
  constructor({images, gpx, url}) {
    super();

    this.imagePositions = {};
    this.imagesCount = images[Object.keys(images)[0]].length;

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

    const derivedCoordinates =
      Object.keys(images).reduce(function (result, path) {
        result.lines[path] = images[path];
        images[path].forEach(image => {
          result.markers[image.fileName] = image;
        });
        return result;
      }, {
        lines: {},
        markers: {}
      });

    this.state.lines = gpx
      ? {[url]: gpx.path}
      : derivedCoordinates.lines;

    this.state.markers = (url === '/' || url === '/index.html')
      ? {}
      : derivedCoordinates.markers;
  }

  onMapCollectionClick(collection) {
    window.location = `/${collection}/index.html`
  }

  setImagePositions(path, rect) {
    this.imagePositions[path] = rect;
  }

  setMarkerPositions(markers) {
    this.setState({
      markerPositions: markers
    }, () => this.setState(
      // This [the need to pass markers to triangleCoords fn seems like Preact
      // glitch – inside the setState callback, markerPositions should be
      // already set, but they are not
      this.getTriangleCoordinates(markers)
    ));
  }

  updateScrollOffset(scrollTop) {
    let itemInViewport;
    Object.keys(this.imagePositions).some(element => {
      const inViewport = isInViewport(
        this.imagePositions[element],
        scrollTop
      );
      if (inViewport) {
        itemInViewport = element;
        return true;
      }
    });

    this.setState({
      scrollOffset: scrollTop,
      currentImage: itemInViewport
    }, () => this.setState(
      this.getTriangleCoordinates()
    ));
  };

  getTriangleCoordinates(markers) {
    const {
      currentImage,
      scrollOffset,
    } = this.state;

    const markerPositions = markers || this.state.markerPositions;

    if (!currentImage || !markerPositions[currentImage]) {
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
      lines,
      markers,
    } = state;

    return html`<main>
      <${Map}
        lines=${lines}
        markers=${markers}
        onMount=${this.setMarkerPositions}
        onCollectionClick=${this.onMapCollectionClick}
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
