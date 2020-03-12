/* eslint-env node */

const {promisify} = require('util');

const exiftool = require('node-exiftool');
const exiftoolBin = require('dist-exiftool')
const {Minimatch} = require('minimatch');
const path = require('path');
const writeFile = promisify(require('fs').writeFile);

const CACHE_FILE_PATTERN = /\.exifcache\.json$/;
const DEFAULT_PATH = '**/*.+(gif|jpg|mp4|png)';

module.exports = function(options) {
  const matcher = new Minimatch((options && options.path) || DEFAULT_PATH, {
    nocase: true,
  });

  return function(files, metalsmith, done) {
    if (!Object.keys(files).some(file => matcher.match(file))) {
      return done();
    }

    const ep = new exiftool.ExiftoolProcess(exiftoolBin);

    return ep
    .open()
    .then(() => {
      console.log('exif process started');
      const promises = Object.entries(files).map(([file, data]) => {
        if (!matcher.match(file)) {
          return;
        }

        const cacheFilePath = `${file}.exifcache.json`;

        if (options.cache && cacheFilePath in files) {
          const cacheFileData = files[cacheFilePath];

          // Don't use stale cache
          if (cacheFileData.stats.mtime >= data.stats.mtime) {
            data.exif = JSON.parse(files[cacheFilePath].contents.toString());
            return;
          }
        }

        return ep
        .readMetadata(metalsmith.path(metalsmith.source(), file))
        .then(results => {
          if (results.error) {
            throw new Error(`Exiftool error: ${results.error}`);
          }

          if (!results.data.length) {
            throw new Error('No data returned from exiftool');
          }

          const exifData = Object.assign({}, results.data[0]);
          // These are filesystem dependent and won't match if you switch
          // machines. They are also relatively useless.
          delete exifData.SourceFile;
          delete exifData.Directory;
          data.exif = exifData;
          if (options.cache) {
            return writeFile(
              path.join(metalsmith.source(), cacheFilePath),
              JSON.stringify(exifData),
            );
          }
        });
      });

      return Promise.all(promises);
    })
    .then(() => ep.close(), () => ep.close())
    .then(() => {
      // Don't pollute output with cache files
      Object.keys(files).forEach(file => {
        if (CACHE_FILE_PATTERN.test(file)) {
          delete files[file];
        }
      });
    })
    .then(done, done);
  };
};
