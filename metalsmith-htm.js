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
      const props = {
        url: fileName,
        contents: file.contents.toString()
      };

      App.requiredProps.forEach(prop => {
        props[prop] = file[prop];
      });
      const body = renderToString(
        h(App, props)
      );
      files[fileName].contents = options.document(props, body);
    });

    done();
  }
}
