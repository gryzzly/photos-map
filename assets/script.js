import { h, hydrate } from '../web_modules/preact.js';
import App from '../components/App.js';

hydrate(
  h(App, { url: location.pathname, ...window.state }),
  document.querySelector('.root')
);
