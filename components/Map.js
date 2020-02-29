import htm from '../web_modules/htm.js';
import { h, Component, createRef } from '../web_modules/preact.js';
import {rafDebounce} from "./util.js";
const html = htm.bind(h);

export default class Map extends Component {
  constructor() {
    super();
    this.map = null;
    this.photoMarkers = null;
    this.ref = createRef();
    this.updateMarkerPositions = this.updateMarkerPositions.bind(this);
    this.debouncedUpdate = rafDebounce(
      this.updateMarkerPositions,
      false
    );
  }

  shouldComponentUpdate() {
    return false;
  }

  componentDidMount() {
    const map = L.map(this.ref.current).setView([51.505, -0.09], 13);

    this.map = map;

    const {
      imagesByCollection,
      onCollectionClick,
      images,
      url,
      onMount,
    } = this.props;

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

    const imageLocations = imagesByCollection;

    let lines = [];

    Object.keys(imageLocations).forEach(function (path, index) {
      const polyline = L.polyline(imageLocations[path], {
        weight: 10,
        // dashArray: '10, 20',
        lineCap: 'square', // avoid round borders.
        // color: `hsl(${312 + (index * Math.random() * 45)}, 70%, 95%)`,// pink
        color: `#fff`,
      });

      polyline.on('click', () => onCollectionClick(path));
      polyline.addTo(map);
      polyline._path.setAttribute('filter', 'url(#blur)');
    });
    const topLines = [];
    Object.keys(imageLocations).forEach(function (path, index) {
      const polyline = L.polyline(imageLocations[path], {
        weight: 3,
        // dashArray: '5 10',
        lineCap: 'square' , // Optional, just to avoid round borders.
        color: 'rgb(0,91,180)',
      });
      const polyline2 = L.polyline(imageLocations[path], {
        weight: 6,
        // dashArray: '3 4',
        lineCap: 'square' , // Optional, just to avoid round borders.
        color: '#fff',
      });
      polyline.on('click', () => onCollectionClick(path));
      polyline2.on('click', () => onCollectionClick(path));
      topLines.push(polyline2);
      topLines.push(polyline);
    });
    const linesGroup = L.featureGroup(topLines).addTo(map);
    map.fitBounds(linesGroup.getBounds());

    const photoMarkers = L.featureGroup();

    if (url === '/' || url === '/index.html') {
      return;
    }
    Object.keys(imageLocations).forEach(function (path, index) {
      imageLocations[path].forEach(image => {
        const marker = L.marker(image, {
          icon: L.divIcon(L.extend({
            html: '<img src="/picture.svg" />​',
            className: 'leaflet-marker'
          }, image, {
            iconSize: [12, 12],
          })),
        });
        marker.image = image.fileName;
        photoMarkers.addLayer(marker);
      });
    });

    photoMarkers.addTo(map);

    this.photoMarkers = photoMarkers;

    this.updateMarkerPositions();

    this.map.on('move zoomend', this.updateMarkerPositions);
    window.addEventListener('resize', this.debouncedUpdate);
  }

  componentWillUnmount() {
    this.map.off('move zoomend', this.updateMarkerPositions);
    window.removeEventListener('resize', this.debouncedUpdate);
  }

  updateMarkerPositions() {
    console.log('updateMarkerPositions');
    let markers = {};
    let mapOffset = this.map.getContainer().getBoundingClientRect();

    this.photoMarkers.eachLayer(marker => {
      const offset = this.map.latLngToContainerPoint(marker.getLatLng());
      markers[marker.image] = offset.add([mapOffset.x, mapOffset.y]);
    });

    this.props.onMount(markers);
  }

  render() {
    return html`<div id="map" ref=${this.ref}></div>`
  }
}
