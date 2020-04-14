import htm from '../web_modules/htm.js';
import { h, Component, createRef } from '../web_modules/preact.js';
const html = htm.bind(h);

class Image extends Component {
  constructor() {
    super();
    this.state = {
      updated: false
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.src !== this.props.src) {
      this.setState({
        updated: true
      });
      setTimeout(() => this.setState({
        updated: false
      }));
    }
  }

  render() {
    const {updated} = this.state;
    const {src, lqipSrc} = this.props;
    return html`<div>
      <img src=${updated ? '' : lqipSrc} />
      ${updated ? null : html`<picture>
        <source
          type="image/webp"
          srcset=${src}
        />
        <source
          srcset=${src.replace('webp', 'jpg')}
        />
        <img
          src=${src.replace('webp', 'jpg')}
        />
      </picture>`}
    </div>`
  }
}

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

      ${selectedImage && html`<${Image}
        src=${selectedImage.fileName.replace('jpg', 'webp')}
        lqipSrc=${`/thumbs${selectedImage.fileName}`}
      />`}

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
