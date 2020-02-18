var build = require('./main');
var serve = require('./serve');
var watch = require('node-watch');

build(serve);
watch(
  [
  'assets'
  , 'content'
  , 'components'
  ],
  {
  recursive: true
  },
  function onChange(eventName, file) {
    console.log(eventName + ':' + file);
    build();
  }
);
