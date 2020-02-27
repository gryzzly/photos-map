import htm from '../web_modules/htm.js';
import { h, Component, createRef } from '../web_modules/preact.js';
const html = htm.bind(h);

import LinkToItem from './LinkToItem.js';
import ContentPhoto from "./ContentPhoto.js";

import {throttle} from "./util.js";

export default class App extends Component {
  constructor() {
    super();
    this.ref = createRef();
  }

  componentDidMount() {
    this.props.onScroll(this.ref.current.scrollTop);
    this.ref.current.addEventListener('scroll', throttle(() => {
      this.props.onScroll(this.ref.current.scrollTop);
    }, 16));
  }
  render({
    list = [],
    contents = '',
    images = {},
    name = '',
    onMount,
  }) {
    return html`<div class="contents" ref=${this.ref}>
      <h1 class="contents__title">
        <a href="/">Home</a>
      </h1>
      <!-- Index Page -->
      ${list.length > 0 && html`<ul class="contents__stories_list">
        ${list.map(collection => html`<${LinkToItem} ...${collection} />`)}
      </ul>`}
      <!-- Generated HTML Contents i.e. Markdown --> 
      ${contents.length > 0 && html`<div>${html([contents])}</div>`}
      <!-- Image Gallery  -->
      ${images[name] &&
        html`<ul class="contents__images_list">
            ${images[name].map(
          img => html`<${ContentPhoto} img=${img} onMount=${onMount} />`
        )}
        </ul>`
      }
    </div>`;
  }
}