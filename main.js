import Metalsmith from 'metalsmith';
import markdown from 'metalsmith-markdown';
import assets from 'metalsmith-assets';
import mediaMetadata from './metalsmith-media-metadata';
import photoLocations from './photo-locations';
import title from 'metalsmith-title';

import { h } from 'preact';
import renderToString from 'preact-render-to-string';
import App from './components/App';
import document from './document';

function build (done) {
  // __dirname defined by node.js
  Metalsmith(__dirname)
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
  .use(function (files, metalsmith, done) {
    // get layout file defining html component and a place to insert prepared
    // HTML
    // render the file and toBuffer it into contents

    Object.keys(files)
    .filter(fileName => fileName.endsWith('.html'))
    .forEach(fileName => {
      const file = files[fileName];
      const body = renderToString(
        h(App, {
          ...file,
          url: fileName,
          contents: file.contents.toString()
        })
      );
      files[fileName].contents = document(file, body);
    });

    done();
  })
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
  }))
  .build(function(err) {
    if (err) {
      console.log('Error building:' + err);
      throw new Error(err);
    }
    console.log('Built successfully.')
    if (done) {
      done();
    }
  });
};

module.exports = build;

if (process.argv[2] === "run") {
  build();
}