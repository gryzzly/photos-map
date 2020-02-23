import htm from '../web_modules/htm.js';
import { h, Component, createRef } from '../web_modules/preact.js';
const html = htm.bind(h);

import {debounce} from "./util.js";

export default class ContentPhoto extends Component {
  ref = createRef();

  componentDidMount() {
    this.props.onMount(
      this.props.img.thumbnail,
      {
        top: this.ref.current.offsetTop,
        right: this.ref.current.offsetLeft + this.ref.current.offsetWidth,
        height: this.ref.current.offsetHeight,
        bottom: this.ref.current.offsetTop + this.ref.current.offsetHeight
      }
    );
    window.addEventListener('resize', debounce(() => {
      this.props.onMount(
        this.props.img.thumbnail,
        {
          top: this.ref.current.offsetTop,
          right: this.ref.current.offsetLeft + this.ref.current.offsetWidth,
          height: this.ref.current.offsetHeight,
          bottom: this.ref.current.offsetTop + this.ref.current.offsetHeight
        }
      );
    }, 16));

  }

  render({img}) {
   return html`<li>
      <a href="${img.thumbnail}"><img src="${img.thumbnail}" ref=${this.ref} /></a>
   </li>`;
  }
}