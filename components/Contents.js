import htm from '../web_modules/htm.js';
import { h, Component } from '../web_modules/preact.js';
const html = htm.bind(h);

import LinkToItem from './LinkToItem.js';

export default function({
  list = [],
  contents = '',
  images = {},
  name = ''
}) {
  return html`<div class="contents">
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
        img => html`<li>
          <a href="${img.thumbnail}}"><img src="${img.thumbnail}" /></a>
        </li>`
      )}
    </ul>`
    }
  </div>`;
}