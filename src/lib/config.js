const t = require('transducers.js');

let config = {};

function load(props) {
  config = t.merge(config, props);
}

function get(key) {
  return config[key];
}

function set(key, val) {
  config[key] = val;
}

module.exports = {
  get: get,
  set: set,
  load
};
