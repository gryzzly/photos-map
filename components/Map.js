import htm from '../web_modules/htm.js';
import { h, Component, createRef } from '../web_modules/preact.js';
import {rafDebounce} from "./util.js";
const html = htm.bind(h);

class Polyline extends Component {
  componentDidMount() {
    const { map, positions, style, onClick, path, filter } = this.props;

    this.lElement = new L.polyline(positions, style);
    this.lElement.addTo(map);

    if (filter) {
      this.lElement._path.setAttribute('filter', filter);
    }

    if (onClick) {
      this.lElement.on('click', () => onClick(path));
    }
  }

  componentWillUnmount() {
    this.lElement.off('click');
    this.lElement.removeFrom(map);
  }

  render() {
    return null;
  }
}

const lineStyles = [
  {
    weight: 10,
    lineCap: 'square',
    color: '#fff',
    filter: 'url(#blur)'
  },
  {
    weight: 6,
    lineCap: 'square',
    color: 'rgb(0, 91, 180)',
  },
  {
    weight: 3,
    lineCap: 'square',
    color: '#fff',
  }
];

class Marker extends Component {
  componentWillUpdate(nextProps) {
    if (nextProps.style.icon !== this.props.style.icon) {
      this.lElement.setIcon(nextProps.style.icon);
    }
  }
  componentDidMount() {
    const { map, position, style, onClick, path, className } = this.props

    this.lElement = L.marker(position, style);
    this.lElement.addTo(map);

    if (className) {
      this.lElement._icon.classList.add(className);
    }

    if (onClick) {
      this.lElement.on('click', () => onClick(path));
    }
  }
  componentWillUnmount() {
    this.lElement.off('click');
    this.lElement.removeFrom(map);
  }
}

let MarkerIcon, MarkerIconCurrent;

export default class Map extends Component {
  constructor() {
    super();

    this.map = null;
    this.ref = createRef();
    this.markerRefs = [];

    ['setupMap', 'updateMarkerPositions', 'storeMarkerRef']
      .forEach(fn => this[fn] = this[fn].bind(this));

    this.debouncedUpdate = rafDebounce(
      this.updateMarkerPositions,
      false
    );
  }

  componentWillUpdate(nextProps) {
    if (this.props.currentImage && nextProps.currentImage !== this.props.currentImage) {
      this.map.panTo(this.props.markers[nextProps.currentImage], {
        duration: 1,
        easeLinearity: .5
      });
    }
  }

  storeMarkerRef(marker) {
    this.markerRefs.push(marker);

    if (Object.keys(this.props.markers).length === this.markerRefs.length) {
      this.updateMarkerPositions();
    }
  }

  componentDidMount() {
    MarkerIcon = L.divIcon({
      html: '<img src="/picture.svg" />',
      className: 'leaflet-marker',
      iconSize: [12, 12],
    });

    MarkerIconCurrent = L.divIcon({
      html: '<img src="/picture.svg" />',
      className: 'leaflet-marker leaflet-marker-current',
      iconSize: [15, 15],
    });

    this.setupMap();

    this.map.on('move zoomend', this.updateMarkerPositions);
    window.addEventListener('resize', this.debouncedUpdate);
  }


  setupMap() {
    // FIXME get rid of the setView here, the argument is completely random
    const map = L.map(this.ref.current).setView([51.505, -0.09], 13);

    this.map = map;

    L.tileLayer(
      // 'https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png?{foo}',
      // 'https://tiles.wmflabs.org/hikebike/{z}/{x}/{y}.png',
      // 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        foo: 'bar',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }
    ).addTo(map);

    map.fitBounds(
      Object.entries(this.props.lines).reduce((result, [path, coordinates]) => {
        result = result.concat(coordinates);
        return result;
      }, [])
    );
  }

  componentWillUnmount() {
    this.map.off('move zoomend', this.updateMarkerPositions);
    window.removeEventListener('resize', this.debouncedUpdate);
  }

  updateMarkerPositions() {
    let markerOffsets = {};
    let { markers } = this.props;
    let mapOffset = this.map.getContainer().getBoundingClientRect();
    Object.keys(markers).forEach(marker => {
      const offset =
        this.map.latLngToContainerPoint([
          markers[marker].lat,
          markers[marker].lng
        ]);
      markerOffsets[marker] = offset.add([mapOffset.x, mapOffset.y]);
    });

    this.props.onMount(markerOffsets);
  }

  render() {
    const {lines, markers, onCollectionClick, currentImage} = this.props;

    return html`<div id="map" ref=${this.ref}>
      ${this.map && Object.keys(lines).map(path => lineStyles.map(style => html`<${Polyline}
        positions="${lines[path]}"
        style=${style}
        map=${this.map}
        filter=${style.filter || null}
        onClick=${onCollectionClick}
        path=${path}
      />`))}
      ${this.map && Object.keys(markers).map(imagePath => html`<${Marker}
        position=${markers[imagePath]}
        className=${imagePath === currentImage ? 'current' : ''}
        ref=${this.storeMarkerRef}
        map=${this.map}
        style=${{
          icon: imagePath === currentImage ? MarkerIconCurrent : MarkerIcon,
        }}
      />`)}
    </div>`;
  }
}
