import Metalsmith from 'metalsmith';
import markdown from 'metalsmith-markdown';
import assets from 'metalsmith-assets';
import mediaMetadata from './metalsmith-media-metadata';
import photoLocations from './photo-locations';
import htm from './metalsmith-htm';
import title from 'metalsmith-title';
import sharp from 'metalsmith-sharp';
import watch from 'metalsmith-watch';
import serve from 'metalsmith-serve';

import { h } from 'preact';
import renderToString from 'preact-render-to-string';
import App from './components/App';
import document from './document';

const metalsmith = Metalsmith(__dirname)
  .source('./content')      // source directory
  .destination('./public')   // destination directory
  .clean(true)        // clean destination before
  // processing content files
  .use(mediaMetadata({
    path: '**/*.+(jpg|jpeg)',
  }))
  .use(markdown())
  .use(title())
  .use(photoLocations())
  .use(sharp([
    // generate thumbnails
    {
      namingPattern: 'thumbs/{dir}/{name}{ext}',
      methods: [{
        name: 'jpeg',
        args: {
          progressive: true,
          quality: 61,
        }
      },
      {
        name: 'resize',
        args: (metadata) => [
          Math.round(metadata.width * 0.5),
          Math.round(metadata.height * 0.5),
        ],
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

  ]))
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

  if (process.argv[2] === 'dev') {
    metalsmith
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

  metalsmith
    .build(function(err) {
      if (err) {
        console.log('Error building:' + err);
        throw new Error(err);
      }
      console.log('Built successfully.')
    });
