const path = require('path');
const parseDMS = require('./degrees-minutes-seconds');

function parseDate(s) {
  const b = s.split(/\D/);
  return new Date(b[0],b[1]-1,b[2],b[3],b[4],b[5]);
}

module.exports = function (options) {
  options = options || {};
  options.collection = options.collection || 'dir';

  return function (files, metadata, done) {
    const imageLocations = Object.keys(files)
      .filter(fileName => {
        return files[fileName].exif &&
          files[fileName].exif.hasOwnProperty('GPSLatitude')
      })
      .map(fileName => {
        const file = files[fileName];
        // add config for this option, to select if file is part of collection
        const collection = path.parse(fileName).dir;
        const position = parseDMS(file.exif.GPSPosition);

        return {
          // FIXME: make proper path here
          thumbnail: `/` + fileName,
          lat: position.Latitude,
          lng: position.Longitude,
          date: parseDate(file.exif.DateTimeOriginal),
          collection,
        };
      })
      .sort((a, b) => a.date - b.date);

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
          indexExists,
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
      };
    });

    // creates index file with images data
    // FIXME: perhaps add data to existing index.html if it’s there:
    // allow for having index.md in root of the content to provide some content.
    files['index.html'] = {
      path: 'index.html',
      contents: '',
      images: imagesByCollection,
      list: collections
    };
    done();
  }
};