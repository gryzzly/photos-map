import htm from '../web_modules/htm.js';
import { h, Component, createRef } from '../web_modules/preact.js';
import {debounce, throttle} from "./util.js";
const html = htm.bind(h);

function gatherMarkerPositions (photoMarkers, map, mapOffset) {
  let markers = {};
  photoMarkers.eachLayer(marker => {
    const offset = map.latLngToContainerPoint(marker.getLatLng());
    markers[marker.thumbnail] = offset.add([mapOffset.x, mapOffset.y]);
  });
  return markers;
}

export default class Map extends Component {
  ref = createRef();

  shouldComponentUpdate() {
    return false;
  }

  componentDidMount() {
    const map = L.map(this.ref.current).setView([51.505, -0.09], 13);

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
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      // 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        foo: 'bar',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }
    ).addTo(map);

    (function() {
      const imageLocations = imagesByCollection;

      let lines = [];

      Object.keys(imageLocations).forEach(function (path, index) {
        const polyline = L.polyline(imageLocations[path], {
          weight: 10,
          // dashArray: '10, 20',
          lineCap: 'square', // avoid round borders.
          color: `hsl(${312 + (index * Math.random() * 45)}, 70%, 95%)`,// pink
          // color: `#fff`,
        });

        polyline.on('click', () => onCollectionClick(path));
        polyline.addTo(map);
        polyline._path.setAttribute('filter', 'url(#blur)');
      });
      const topLines = [];
      Object.keys(imageLocations).forEach(function (path, index) {
        const polyline = L.polyline(imageLocations[path], {
          weight: 1.5,
          dashArray: '3 4',
          lineCap: 'square' , // Optional, just to avoid round borders.
          color: '#555',
        });
        polyline.on('click', () => onCollectionClick(path));
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
          marker.thumbnail = image.thumbnail;
          photoMarkers.addLayer(marker);
        });
      });

      photoMarkers.addTo(map);


      onMount(gatherMarkerPositions(
        photoMarkers,
        map,
        map.getContainer().getBoundingClientRect()
      ));
      map.on('move zoom', throttle(() => {
        onMount(gatherMarkerPositions(
          photoMarkers,
          map,
          map.getContainer().getBoundingClientRect()
        ));
      }, 16));
      window.addEventListener('resize', debounce(() => {
        onMount(gatherMarkerPositions(
          photoMarkers,
          map,
          map.getContainer().getBoundingClientRect()
        ));
      }, 16));
    }());
  }
  render() {
    return html`<div id="map" ref=${this.ref}></div>`
  }
}
