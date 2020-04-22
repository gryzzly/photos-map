const path = require('path');

const toGeoJSON = require("@tmcw/togeojson");
const DOMParser = require("xmldom").DOMParser;
const simplifyGeoJSON = require('simplify-geojson');
const fetch = require('node-fetch');

const parseDMS = require('./degrees-minutes-seconds');

const TOKEN = process.env.LOCATION_HQ_TOKEN;
// with `lat`/`lon` params
const REVERSE_GEOCODING_ENDPOINT =
  `https://eu1.locationiq.com/v1/reverse.php?key=${TOKEN}&format=json`;

function parseDate(s) {
  const b = s.split(/\D/);
  return new Date(b[0],b[1]-1,b[2],b[3],b[4],b[5]);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sequence(tasks, fn) {
  return tasks.reduce((promise, task) => promise.then(() => fn(task)), Promise.resolve());
}

module.exports = function (options) {
  options = options || {};
  options.collection = options.collection || 'dir';
  options.processImages = false;

  return async function (files, metadata, done) {
    const updatedFiles = {
      processedImages: {},
      collectionPages: {},
    };

    // FIXME: do not attempt to recreate content files with data
    //  when folders of content aren’t processed (hot-reloading case)
    if (Object.keys(files).length < 2) {
      done();
      return;
    }

    const imagesWithLocation = Object.keys(files)
      .filter(fileName => {
        return files[fileName].exif &&
          files[fileName].exif.hasOwnProperty('GPSLatitude')
      });

    const gpxFilesByCollection = Object.keys(files)
      .filter(fileName => fileName.endsWith('.gpx'))
      .reduce((result, fileName) => {
        const collection = path.parse(fileName).dir;
        const file = files[fileName];
        result[collection] = file;

        const xml = new DOMParser().parseFromString(
          file.contents.toString()
        );

        const geoJSON = toGeoJSON.gpx(xml);
        const simplifiedGeoJSON = simplifyGeoJSON(geoJSON, 0.0009);

        result[collection].gpx =
          simplifiedGeoJSON.features.reduce((result, feature) => {
            feature.geometry.coordinates.forEach(([lng, lat]) => {
              result.path.push({ lat, lng });
            });
            return result;
          }, { path: [] });

        return result;
      }, {});

    const imageLocations =  imagesWithLocation.map(fileName => {
        const file = files[fileName];
        // add config for this option, to select if file is part of collection
        const collection = path.parse(fileName).dir;
        const position = parseDMS(file.exif.GPSPosition);
        const width = file.exif.ImageWidth;
        const height = file.exif.ImageHeight;

        return {
          // FIXME: make proper path here
          thumbnail: `/thumbs/` + fileName,
          fileName: '/' + fileName,
          lat: position.Latitude,
          lng: position.Longitude,
          date: parseDate(file.exif.DateTimeOriginal),
          width,
          height,
          collection,
        };
      })
      .sort((a, b) => a.date - b.date);

    await sequence(imageLocations, async (image) => {
      let address;
      try {
        // the service has 2 reqs/second and 60/minute rate limiting
        await sleep(1001);
        const response = await fetch(
          `${REVERSE_GEOCODING_ENDPOINT}&lat=${image.lat}&lon=${image.lng}`
        );
        const json = await response.json();
        address = json.display_name;
      } catch (error) {
        console.log('Reverse geocoding failed:');
        console.log(error);
      }
      image.address = address;
      return image;
    });

    const imagesByCollection = imageLocations
      .reduce(function (result, current) {
        result[current.collection] = result[current.collection] || [];
        result[current.collection].push(current);
        return result;
      }, {});

    const collections = Object.keys(imagesByCollection)
      .map(function (collectionName) {
        const indexFile = files[collectionName + '/index.html'];
        const indexExists = Boolean(indexFile);

        return {
          path: collectionName + '.html',
          contents: indexExists ? indexFile.contents : Buffer.from(collectionName),
          title: indexExists  ? indexFile.title : '',
          name: collectionName,
        }
      });

    // update or create index files for collection keys
    collections.forEach(function (collection) {
      const collectionName = collection.name;

      files[collectionName + '/index.html'] = {
        path: collectionName + '/index.html',
        ...collection,
        contents: collection.contents.toString(),
        images: {
          [collectionName]: imagesByCollection[collectionName]
        },
        gpx:
            gpxFilesByCollection[collectionName] &&
            gpxFilesByCollection[collectionName].gpx,
      };
    });

    // creates index file with images data
    // FIXME: perhaps add data to existing index.html if it’s there:
    // allow for having index.md in root of the content to provide some content.
    files['index.html'] = {
      path: 'index.html',
      contents: Boolean(files['index.html'])
        ? files['index.html'].contents.toString()
        : '',
      images: imagesByCollection,
      list: collections.reverse()
    };
    done();
  }
};
