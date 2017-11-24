const invariant = require("invariant");

function slugify(name) {
  return name.replace(/[ \n!@#$%^&*():"'|?=]/g, '-');
}

function mergeObj(...args) {
  const obj = {};
  args.forEach(arg => {
    Object.keys(arg).forEach(k => {
      obj[k] = arg[k];
    });
  });
  return obj;
}

// Assertions

function assert(msg, val) {
  if(val === undefined || val === null || val === false) {
    throw new Error('assertion failure: ' + msg);
  }
}

module.exports = {
  slugify,
  mergeObj,
  invariant,
};
