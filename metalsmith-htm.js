import renderToString from "preact-render-to-string";
import {h} from "preact";
import App from "./components/App";
import document from "./document";

export default function htm(options) {

  if (!options.document) {
    throw new Error('Please provide document template function.');
  }

  return function htmProcessor(files, metalsmith, done) {
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
      files[fileName].contents = options.document(file, body);
    });

    done();
  }
}
