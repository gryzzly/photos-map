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
  rootMargin: '300px 0px', // margin around root. Values are similar to css
  // property. Unitless values not allowed
  threshold: .01 // visible amount of item shown in relation to root
};

export default class ContentPhoto extends Component {
  constructor() {
    super();
    this.observer = null;
    this.ref = createRef();
    [
      'onImagePositionsUpdate',
      'onImageLoaded',
      'onObserverChange',
      'onClick',
    ]
      .forEach(fn => {
        this[fn] = this[fn].bind(this);
      });
    this.debouncedUpdate = rafDebounce(
      this.onImagePositionsUpdate,
      true
    );

    this.deboundcedObserverChange = rafDebounce(
      this.onObserverChange,
      true,
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
        const sources = imageElement.parentElement.querySelectorAll('source');
        sources.forEach(source => {
          source.setAttribute(
            'srcset',
            source.getAttribute('data-srcset')
          );
        });
        imageElement.setAttribute(
          'src',
          imageElement.getAttribute('data-src')
        );
        this.observer.disconnect();
        this.observer = null;
      }
    });
  }

  onClick(e) {
    // don’t bring the event down to the link
    e.preventDefault();
    e.stopPropagation();
    this.props.onClick(this.props.img);
  }

  componentDidMount() {
    const imageElement = this.ref.current;
    this.onImagePositionsUpdate();
    imageElement.addEventListener('load', this.onImageLoaded);
    window.addEventListener('resize', this.debouncedUpdate);

    this.observer = new IntersectionObserver(
      this.deboundcedObserverChange,
      Object.assign(
        { root: this.props.scrollingElement.current },
        OBSERVER_OPTIONS
      ),
    );

    this.observer.observe(imageElement);
  }

  componentWillUnmount() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.ref.current.removeEventListener('load', this.onImageLoaded);
    window.removeEventListener('resize', this.debouncedUpdate);
  }

  render({img, onClick}) {
    return html`<li onClickCapture=${this.onClick}>
      <a href="${img.fileName}">
        <div class="imageWrapper">
          <picture>
            <source
              type="image/webp"
              data-srcset="${img.thumbnail.replace('jpg', 'webp')}"
            />
            <source
              data-srcset="${img.thumbnail}"
            />
            <img
              ref=${this.ref}
              data-src=${img.thumbnail}
              src="${placeholderSrc(img.width, img.height)}"
            />
          </picture>
        </div>
      </a>
   </li>`;
  }
}
