import htm from '../web_modules/htm.js';
import { h, Component } from '../web_modules/preact.js';
const html = htm.bind(h);

import Map from './Map.js';
import Contents from "./Contents.js";
import ImagesViewer from './ImagesViewer.js'

function isInViewport (bounding, scrollTop) {
  return (
    bounding.top - scrollTop >= 0 &&
    scrollTop >= bounding.top - window.innerHeight
  );
}

function getCurrentIndex(images, currentImage) {
  let currentIndex = 0;
  images.some((img, index) => {
    if (img.fileName === currentImage.fileName) {
      currentIndex = index;
      return true;
    }
  });
  return currentIndex;
}

export default class App extends Component {
  constructor({images, gpx, url}) {
    super();

    this.imagePositions = {};

    this.mediaQueryList = null;

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
      markers: {},
      lines: {},
      isGalleryOpen: false,
      orientation: null,
    };

    [
      'onMapCollectionClick',
      'setImagePositions',
      'setMarkerPositions',
      'updateScrollOffset',
      'onMarkerClick',
      'onGalleryOpen',
      'onGalleryClose',
      'onGalleryAdvance',
      'onGalleryBack',
      'onMediaQueryUpdate',
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
      ? {[url]: gpx}
      : derivedCoordinates.lines;

    this.state.markers = (url === '/' || url === '/index.html')
      ? {}
      : derivedCoordinates.markers;
  }

  componentDidMount() {
    this.mediaQueryList = window.matchMedia("(orientation: landscape)");
    this.onMediaQueryUpdate(this.mediaQueryList);
    this.mediaQueryList.addListener(this.onMediaQueryUpdate);
  }

  componentWillUnmount() {
    this.mediaQueryList.removeEventListener(this.onMediaQueryUpdate);
    this.mediaQueryList = null;
  }

  onMediaQueryUpdate({matches}) {
    this.setState({
      orientation: matches ? 'landscape' : 'portrait'
    });
  }

  onMapCollectionClick(collection) {
    const {url} = this.props;
    if (url === '/' || url === '/index.html') {
      window.location = `/${collection}/index.html`
    }
  }

  onMarkerClick(image) {
    this.setState({
      selected: image
    });
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
      const image = this.imagePositions[element];
      const inViewport = isInViewport(
        image,
        scrollTop
      );
      if (inViewport) {
        itemInViewport = element;
        return true;
      }
    });

    this.setState({
      scrollOffset: scrollTop,
      currentImage: itemInViewport,
    }, () => this.setState(
      this.getTriangleCoordinates()
    ));
  };

  getTriangleCoordinates(markers) {
    const {
      currentImage,
      scrollOffset,
      orientation,
    } = this.state;

    const markerPositions = markers || this.state.markerPositions;

    if (
      !currentImage ||
      !markerPositions[currentImage] ||
      orientation === 'portrait'
    ) {
      return;
    }

    const image = this.imagePositions[currentImage];
    const marker = markerPositions[currentImage];

    const coords = {
      leftTopX: image.right,
      leftTopY: image.top - scrollOffset,
      leftBottomX: image.right,
      leftBottomY: image.bottom - scrollOffset,
      rightX: marker.x,
      rightY: marker.y,
    };

    return coords;
  }

  onGalleryOpen(image) {
    this.setState({
      isGalleryOpen: true,
      selected: image,
    });
  }

  onGalleryClose() {
    this.setState({
      isGalleryOpen: false,
    });
  }

  onGalleryBack() {
    const {images, name} = this.props;
    const {selected} = this.state;
    const currentIndex = getCurrentIndex(images[name], selected);
    let nextIndex = currentIndex - 1;
    if (nextIndex === -1) {
      nextIndex = images[name].length - 1;
    }
    this.setState({
      selected: images[name][nextIndex],
    });
  }

  onGalleryAdvance() {
    const {images, name} = this.props;
    const {selected} = this.state;
    const currentIndex = getCurrentIndex(images[name], selected);
    let nextIndex = currentIndex + 1;
    if (nextIndex === images[name].length) {
      nextIndex = 0;
    }
    this.setState({
      selected: images[name][nextIndex],
    });
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
      selected,
      isGalleryOpen,
      orientation,
    } = state;

    const {
      images,
      name
    } = props;

    return html`<main>
      <div class="map-container">
        <${Map}
          lines=${lines}
          markers=${markers}
          onMount=${this.setMarkerPositions}
          onCollectionClick=${this.onMapCollectionClick}
          currentImage=${currentImage}
          onMarkerClick=${this.onMarkerClick}
        />
      </div>
      <${Contents}
        ...${props}
        onMount=${this.setImagePositions}
        onScroll=${this.updateScrollOffset}
        selected=${selected}
        onGalleryOpen=${this.onGalleryOpen}
      />
      <${ImagesViewer}
        selectedImage=${selected}
        images=${images[name]}
        isOpen=${isGalleryOpen}
        onClose=${this.onGalleryClose}
        onNext=${this.onGalleryAdvance}
        onPrev=${this.onGalleryBack}
      />
      <svg
        class="svg-canvas"
        visibility="${
          Boolean(currentImage) && orientation === 'landscape'
            ? 'visible'
            : 'hidden'
        }"
      >
      <polygon
        points="
          ${leftTopX},${leftTopY}
          ${leftBottomX},${leftBottomY}
          ${rightX},${rightY}
        "
        fill="url(#fadein)"
      />
      </svg>
    </main>`;
  }
}

App.requiredProps = [
  'images',
  'name',
  'title',
  'gpx',
  'duration',
  'url',
  'list',
];
