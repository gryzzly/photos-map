import htm from '../web_modules/htm.js';
import { h, Component, createRef } from '../web_modules/preact.js';
const html = htm.bind(h);

import ContentPhoto from "./ContentPhoto.js";

import {rafDebounce} from "./util.js";

export default class Contents extends Component {
  constructor() {
    super();
    this.ref = createRef();
    this.images = {};
    this.createImageRef = this.createImageRef.bind(this);
  }

  componentDidMount() {
    this.props.onScroll(this.ref.current.scrollTop);
    this.ref.current.addEventListener('scroll', rafDebounce(() => {
      this.props.onScroll(this.ref.current.scrollTop);
    }, true));
  }

  componentWillUpdate(nextProps) {
    if (
      nextProps.selected && this.props.selected &&
      nextProps.selected.fileName !== this.props.selected.fileName
    ) {
      this.images[nextProps.selected.fileName].ref.current.scrollIntoView();
    }
  }

  createImageRef (img) {
    this.images[img.props.img.fileName] = img;
  }

  render(props) {
    const list = props.list || [];
    const contents = props.contents || '';
    const images = props.images || {};
    const name = props.name || '';
    const gpx = props.gpx;
    const duration = props.duration;
    const onMount = props.onMount;
    const onGalleryOpen = props.onGalleryOpen;
    const title = props.title;

    let durationInHours, fullHours;
    if (duration) {
      durationInHours = duration / 1000 / 60 / 60;
      fullHours = Math.ceil(durationInHours);
    }

    return html`<div class="contents" ref=${this.ref}>

    <h1 class="contents__title">
        <a href="/">Home</a>
      </h1>

      ${title && html`<h4>${title}</h4>`}

      ${duration && html`<div>
        This trip took us about ${fullHours} hours.
      </div>`}

        <!-- Generated HTML Contents i.e. Markdown -->
        ${contents.length > 0 && html`<div>
          ${html([contents])}
        </div>`}

      <!-- Index Page -->
      ${list.length > 0 && html`<ul class="contents__stories_list">
        ${list.map(({name, title}) => html`<li>
          <a href="/${name}/index.html">${title ? `${name} – ${title}` : name}</a>
        </li>`)}
      </ul>`}

      <!-- Image Gallery  -->
      ${images[name] &&
        html`<ul class="contents__images_list">
            ${images[name].map(
          img => html`<${ContentPhoto}
            img=${img}
            onMount=${onMount}
            ref=${this.createImageRef}
            onClick=${onGalleryOpen}
            scrollingElement=${this.ref}
          />`
        )}
        </ul>`
      }
    </div>`;
  }
}
