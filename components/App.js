import htm from '../web_modules/htm.js';
import { h, Component } from '../web_modules/preact.js';
const html = htm.bind(h);

import Map from './Map.js';
import Contents from "./Contents.js";

export default class App extends Component {
  onMapCollectionClick = (collection) => {
    debugger;
    window.location = `/${collection}/index.html`
  }

  render(props, state) {
    return html`<main>
      <${Map}
        imagesByCollection=${props.images}
        onCollectionClick=${this.onMapCollectionClick} 
      />
      <${Contents} ...${props} />
    </main>`;
  }
}
