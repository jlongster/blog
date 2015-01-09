const http = require('http');
const app = require('../app');
const api = require('../impl/api');

api.connect();
app.testing = true;

let server = http.createServer(app);
server.listen(4000);

console.log('Started testing server on 4000...');
