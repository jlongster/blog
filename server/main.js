const http = require('http');
const nconf = require('nconf');
const api = require('impl/api');
const app = require('./app');

api.connect();

let server = http.createServer(app);
server.listen(nconf.get('http:port'));

console.log('Listening on ' + nconf.get('http:port') + '...');

if(module.hot) {
  module.hot.accept();
  module.hot.accept('./app');

  module.hot.dispose(function() {
    console.log('disposing...');
    server.close();
  });
}
