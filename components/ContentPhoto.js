import htm from '../web_modules/htm.js';
import { h, Component, createRef } from '../web_modules/preact.js';
const html = htm.bind(h);

import {rafDebounce} from "./util.js";

export default class ContentPhoto extends Component {
  constructor() {
    super();
    this.ref = createRef();
    this.onImagePositionsUpdate = this.onImagePositionsUpdate.bind(this);
    this.debouncedUpdate = rafDebounce(
      this.onImagePositionsUpdate,
      true
    );
  }

  onImagePositionsUpdate() {
    console.log('onImagePositionsUpdate');
    this.props.onMount(
      this.props.img.thumbnail,
      {
        top: this.ref.current.offsetTop,
        right: this.ref.current.offsetLeft + this.ref.current.offsetWidth,
        height: this.ref.current.offsetHeight,
        bottom: this.ref.current.offsetTop + this.ref.current.offsetHeight
      }
    );
  };

  componentDidMount() {
    this.onImagePositionsUpdate();
    this.ref.current.addEventListener('load', this.onImagePositionsUpdate);
    window.addEventListener('resize', this.debouncedUpdate);
  }

  componentWillUnmount() {
    this.ref.current.removeEventListener('load', this.onImagePositionsUpdate);
    window.removeEventListener('resize', this.debouncedUpdate);
  }

  render({img}) {
    return html`<li>
      <a href="${img.thumbnail}"><img src="${img.thumbnail}" ref=${this.ref} /></a>
   </li>`;
  }
}