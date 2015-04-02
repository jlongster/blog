var net = require('net');

function BackendHotServer(compiler, opts) {
  this.compiler = compiler;
  this.sockets = [];
  this.opts = opts || {};
  this.onBuild = opts.onBuild || function(err, stats) {
    if(err) {
      console.log('Webpack error: ' + err);
    }
    else {
      console.log(stats.toString(opts.stats));
    }
  };

  compiler.plugin("done", function(stats) {
    this.sockets.forEach(function(sock) {
      sock.write(stats.hash);
    });
  }.bind(this));

  compiler.watch(opts.watchDelay || 300, this.onBuild);
}

BackendHotServer.prototype.listen = function(port, cb) {
  if(typeof port === 'function') {
    cb = port;
    port = null;
  }

  var server = this.server = new net.createServer();
  server.listen(port || 3567, cb);
  server.on('connection', function(sock) {
    this.sockets.push(sock);
    sock.on('close', function(data) {
      this.sockets = this.sockets.filter(function(s) { s !== sock; });
    }.bind(this));
  }.bind(this));
};

BackendHotServer.prototype.close = function() {
  this.sockets = [];
  this.server.close();
  this.server = null;
};

module.exports = BackendHotServer;
