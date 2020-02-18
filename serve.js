var http = require('http');
var connect = require('connect');
var historyApiFallback = require('connect-history-api-fallback');
var serveStatic = require('serve-static');

var app = connect()
  .use(historyApiFallback())
  .use(serveStatic('./public'));

module.exports = function serve(done) {
  http.createServer(app).listen(8888, function () {
  console.log('Dev server serving `public` folder has started listening at' +
    ' localhost:8080');
  if (done) {
    done();
  }
  });
};
