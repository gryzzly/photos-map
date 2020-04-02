import htm from '../web_modules/htm.js';
import { h, Component, createRef } from '../web_modules/preact.js';
const html = htm.bind(h);


export default class ImagesViewer extends Component {
  constructor() {
    super();
    this.state = {
      next: null,
      prev: null,
    };
    ['onKeyUp', 'onNextClick', 'onPrevClick']
      .forEach(fn => this[fn] = this[fn].bind(this));
  }

  componentDidMount() {
    document.addEventListener('keyup', this.onKeyUp);
  }

  componentWillUnmount() {
    document.removeEventListener('keyup', this.onKeyUp);
  }

  onKeyUp(e) {
    if (e.key === "Escape") {
      this.props.onClose();
    }
    // <-
    if (e.keyCode === 37) {
      this.props.onPrev();
    }
    // ->
    if (e.keyCode === 39) {
      this.props.onNext();
    }
  }

  onNextClick(e) {
    e.stopPropagation();
    this.props.onNext();
  }

  onPrevClick(e) {
    e.stopPropagation();
    this.props.onPrev();
  }

  render({isOpen, onClose, selectedImage}) {
    return html`<div
      class=${
        `image-gallery ${isOpen ? 'image-gallery-open' : ''}`
      }
      onclick=${onClose}
    >

      <button
        class="image-gallery-control image-gallery-prev"
        onClick=${this.onPrevClick}
        title="Previous"
      >◀</button>

      ${selectedImage && html`<img src=${selectedImage} />`}

      <button
        onClick=${this.onNextClick}
        class="image-gallery-control image-gallery-next"
        title="Next"
      >▶</button>

      <button
        class="image-gallery-control image-gallery-close"
        onClick=${onClose}
        title="Close"
      >✕</button>
    </div>`;
  }
}
