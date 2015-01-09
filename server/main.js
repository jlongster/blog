const http = require('http');
const nconf = require('nconf');
const api = require('./impl/api');
const app = require('./app');

api.connect();

let server = http.createServer(app);
server.listen(nconf.get('http:port'));

console.log('Started server on ' + nconf.get('http:port') + '...');
