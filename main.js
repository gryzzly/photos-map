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

site
  .use(
    branch('**/*.+(jpg|jpeg)')
    .use(viaCache({
      plugins: [
        mediaMetadata({paths: '**/*.+(jpg|jpeg)'}),
        massageData,
        reverseGeocode(),
      ],
    }))
  );

site
  .use(markdown())
  .use(title())
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

  site
    .build(function(err) {
      if (err) {
        console.log('Error building:' + err);
        throw new Error(err);
      }
    // this way first run of the build doesn’t depend on slow
    // share image processing
    site
    .use(sharp(sharpConfig))
    .build(function(err) {
      if (err) {
        console.log('Error building:' + err);
        throw new Error(err);
      }
      console.log('Second build successfully.')
    })

      console.log('Built successfully.')
    });
