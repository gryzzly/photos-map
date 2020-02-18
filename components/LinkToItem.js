import htm from '../web_modules/htm.js';
import { h, Component } from '../web_modules/preact.js';
const html = htm.bind(h);

export default function LinkToItem({name, title}) {
  return html`<li>
    <a href="/${name}/index.html">${title ? `${title} – ${name}` : name}</a>
  </li>`;
}