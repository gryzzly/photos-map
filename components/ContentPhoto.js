import htm from '../web_modules/htm.js';
import { h, Component, createRef } from '../web_modules/preact.js';
const html = htm.bind(h);

import {rafDebounce} from "./util.js";

const placeholderSrc = (width, height) => `data:image/svg+xml,` +
  encodeURI(`<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 ${width} ${height}"
  />`);

const OBSERVER_OPTIONS = {
  root: null, // relative to document viewport
  rootMargin: '100px', // margin around root. Values are similar to css
  // property. Unitless values not allowed
  threshold: .01 // visible amount of item shown in relation to root
};

export default class ContentPhoto extends Component {
  constructor() {
    super();
    this.observer = null;
    this.ref = createRef();
    ['onImagePositionsUpdate', 'onImageLoaded', 'onObserverChange']
      .forEach(fn => {
        this[fn] = this[fn].bind(this);
      });
    this.debouncedUpdate = rafDebounce(
      this.onImagePositionsUpdate,
      true
    );
  }

  onImageLoaded() {
    this.ref.current.classList.add('loaded');
  }

  onImagePositionsUpdate() {
    this.props.onMount(
      this.props.img.fileName,
      {
        top: this.ref.current.offsetTop,
        right: this.ref.current.offsetLeft + this.ref.current.offsetWidth,
        height: this.ref.current.offsetHeight,
        bottom: this.ref.current.offsetTop + this.ref.current.offsetHeight
      }
    );
  };

  onObserverChange(changes, observer) {
    const imageElement = this.ref.current;
    changes.forEach(change => {
      if (change.intersectionRatio > 0) {
        imageElement.setAttribute(
          'srcset',
          imageElement.getAttribute('data-srcset')
        );
      }
    });
  }

  componentDidMount() {
    const imageElement = this.ref.current;
    this.onImagePositionsUpdate();
    imageElement.addEventListener('load', this.onImageLoaded);
    window.addEventListener('resize', this.debouncedUpdate);

    this.observer = new IntersectionObserver(
      this.onObserverChange,
      OBSERVER_OPTIONS
    );

    this.observer.observe(imageElement);
  }

  componentWillUnmount() {
    this.observer.disconnect();
    this.observer = null;
    this.ref.current.removeEventListener('load', this.onImageLoaded);
    window.removeEventListener('resize', this.debouncedUpdate);
  }

  render({img}) {
    return html`<li>
      <a href="${img.fileName}">
        <div class="imageWrapper">
          <img
            ref=${this.ref}
            src="${placeholderSrc(img.width, img.height)}"
            data-srcset="
              ${img.thumbnail} 1500w,
              ${img.fileName} 3000w
            "
          />
        </div>
      </a>
   </li>`;
  }
}