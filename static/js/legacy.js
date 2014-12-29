const t = require('transducers.js');
const { map, filter } = t;

let unmountHandlers = [];
let mountHandlers = [];

window.window_onPostUnmount = function (handler) {
  unmountHandlers.push(handler);
};

window.window_onPostMount = function(handler) {
  mountHandlers.push(handler);
}

window.window_removePostUnmount = function(handler) {
  unmountHandlers = filter(unmountHandlers, x => x !== handler);
}

window.window_removePostMount = function(handler) {
  mountHandlers = filter(mountHandlers, x => x !== handler);
}

window.window_firePostUnmount = function (post) {
  unmountHandlers.forEach(function(handler) {
    handler(post);
  });
}

window.window_firePostMount = function (post) {
  mountHandlers.forEach(function(handler) {
    handler(post);
  });
}
