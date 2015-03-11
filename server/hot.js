var fs = require('fs');
var net = require('net');

var lastHash = null;

function upToDate() {
  return lastHash === __webpack_hash__;
}

if(module.hot) {
  var server = net.createServer();
  console.log('listening...');
  server.listen('3567');
  server.on('connection', function(sock) {
    sock.on('data', function(data) {
      lastHash = data.toString();
      console.log('got', lastHash, __webpack_hash__, module.hot.status());

      if(!upToDate() && module.hot.status() === 'idle') {
        check();
      }
    });
  });

  function check() {
    module.hot.check(function(err, updatedModules) {
      if(err) {
        console.log('[HMR] Error: ' + err);
        return;
      }
      console.log('[HMR] checked', updatedModules);
      if(!updatedModules) {
        return;
      }

      module.hot.apply({
        ignoreUnaccepted: true
      }, function(err, renewedModules) {
        console.log('[HMR] renewed', renewedModules);

        if(!upToDate()) {
          check();
        }
      });
    });
  }
}
else {
  throw new Error("[HMR] Hot Module Replacement is disabled.");
}
