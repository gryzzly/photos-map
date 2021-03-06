import Metalsmith from 'metalsmith';
import markdown from 'metalsmith-markdown';
import assets from 'metalsmith-assets';
import mediaMetadata from './metalsmith-media-metadata';
import photoLocations from './photo-locations';
import reverseGeocode from './metalsmith-reverse-geocode';
import parseDMS from './degrees-minutes-seconds';
import viaCache from './metalsmith-via-cache';
import htm from './metalsmith-htm';
import title from 'metalsmith-title';
import sharp from 'metalsmith-sharp';
import watch from 'metalsmith-watch';
import serve from 'metalsmith-serve';
import branch from 'metalsmith-branch';

import { encode } from 'blurhash';
import jimp from 'jimp';

import { h } from 'preact';
import renderToString from 'preact-render-to-string';
import App from './components/App';
import document from './document';

import {getCache} from './cache';

const cache = getCache('photo-map');

const sharpConfig = [
  // generate thumbnails
  {
    namingPattern: 'thumbs/{dir}/{name}.jpg',
    methods: [{
      name: 'resize',
      args: (metadata) => [
        Math.round(metadata.width * 0.5),
        Math.round(metadata.height * 0.5),
      ],
    }, {
      name: 'jpeg',
      args: {
        progressive: true,
        quality: 61,
      }
    }],
  },

  {
    namingPattern: 'thumbs/{dir}/{name}.webp',
    methods: [
      {
        name: 'resize',
        args: (metadata) => [
          Math.round(metadata.width * 0.5),
          Math.round(metadata.height * 0.5),
        ],
      },
      {
        name: 'toFormat',
        args: ['webp', {
          force: true,
          quality: 61,
        }]
      }
    ],
  },

  // optimize full size images:
  // make jpegs progressive and create webp
  {
    namingPattern: '{dir}/{name}.jpg',
    methods: [{
      name: 'jpeg',
      args: {
        progressive: true,
        quality: 81,
      }
    }]
  },

  {
    namingPattern: '{dir}/{name}.webp',
    methods: [{
      name: 'webp',
      args: {
        force: true,
        quality: 61,
      }
    }]
  },
];

const site = Metalsmith(__dirname)
  .source('./content')      // source directory
  .destination('./public')   // destination directory
  .clean(false)
;

if (process.argv[2] === 'dev') {
  site
    .use(watch({
      paths: {
        // updating image collections requires full rebuild
        '${source}/**/*': '**/*',
        // JS can be rebuilt one-by-one
        'components/**/*': true,
        'assets/**/*': true,
      }
    }, true))
    .use(serve({
      port: 8888
    }));
}

function massageData (files, metalsmith, done) {
  Object.keys(files).forEach(filename => {
    const file = files[filename];
    if (file.exif && file.exif.GPSPosition) {
      const position = parseDMS(file.exif.GPSPosition);
      file.lat = position.Latitude;
      file.lng = position.Longitude;
    } else {
      console.log('No exif: ' + filename);
    }
  });
  done();
}

function imageData (img) {
  return {
    data: new Uint8ClampedArray(img.bitmap.data),
    height: img.bitmap.height,
    width: img.bitmap.width
  }
}

async function blurhash(files, metalsmith, done) {
  await Promise.all(Object.keys(files).map(filename => {
    return new Promise(resolve => {
      jimp.read(metalsmith.path(metalsmith.source(), filename))
      .then(function (img) {
          jimp.read(
            img.resize(
              img.bitmap.width / 32,
              img.bitmap.height / 32
            )
          )
          .then(function (resizedImg) {
            const blurhash = encode(
              resizedImg.bitmap.data,
              resizedImg.bitmap.width,
              resizedImg.bitmap.height,
              4,
              4
            );
            files[filename].blurhash = blurhash;
            resolve()
          });
      });
    });
  }));
  done();
}

site
  .use(
    branch('**/*.+(jpg|jpeg)')
    .use(viaCache({
      plugins: [
        blurhash,
        mediaMetadata({paths: '**/*.+(jpg|jpeg)'}),
        massageData,
        reverseGeocode(),
      ],
    }))
  );

site
  .use(markdown())
  .use(title({ remove: true }))
  .use(photoLocations())
    // render component tree with file data
  .use(htm({
    document
  }))
  // stuff that is not processed but is simply copied over
  .use(assets({
    // relative to the working directory
    source: './assets',
    // relative to the build directory
    destination: './'
  }))
  .use(assets({
    // relative to the working directory
    source: './components',
    // relative to the build directory
    destination: './components'
  }))
  .use(assets({
    // relative to the working directory
    source: './web_modules',
    // relative to the build directory
    destination: './web_modules'
  }));

  const sharpPlugin =
    sharp(sharpConfig);

  Object.defineProperty(
    sharpPlugin,
    'name',
    {
      value: 'sharpJob'
    }
  );

  site
    .use(
      branch('**/*.+(jpg|jpeg)')
      .use(viaCache({
        plugins: [sharpPlugin]
      }))
    )
    .build(function(err) {
      if (err) {
        console.log('Error building:' + err);
        throw new Error(err);
      }
      console.log('Built successfully.');
    });
