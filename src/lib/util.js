const React = require("react");
const invariant = require("invariant");
var csp = require('js-csp');
var { go, chan, take, put } = csp;

function encodeTextContent(str) {
  return str.replace(/[<>&]/g, function(str) {
    return {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;'
    }[str];
  })
}

function decodeTextContent(str) {
  return str.replace(/(&lt;|&gt;|&amp;)/g, function(str) {
    return {
      '&lt;': '<',
      '&gt;': '>',
      '&amp;': '&'
    }[str];
  })
}

function prevented(cb) {
  return function(e) {
    e.preventDefault();
    return cb.apply(null, arguments);
  }
}

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

// channel utils

function invokeCallback(func /*, args... */) {
  var args = Array.prototype.slice.call(arguments, 1);
  args.unshift(null);
  return invokeCallbackM.apply(this, args);
}

function invokeCallbackM(ctx, func /*, args... */) {
  var args = Array.prototype.slice.call(arguments, 2);
  var c = chan();
  args.push(function(err, res) {
    go(function*() {
      if(err || res) {
        yield put(c, err ? csp.Throw(err) : res);
      }
      c.close();
    });
  });
  func.apply(ctx, args);
  return c;
}

function takeAll(inChan) {
  var ch = chan();
  go(function*() {
    var item, arr = [];
    while((item = yield take(inChan)) !== csp.CLOSED) {
      arr.push(item);
    }
    yield put(ch, arr);
    ch.close();
  });
  return ch;
}

function takeArray(chans) {
  var ch = chan();
  go(function*() {
    var arr = [];
    for(var i=0; i<chans.length; i++) {
      arr.push(yield take(chans[i]));
      chans[i].close();
    }
    yield put(ch, arr);
  });
  return ch;
}

function toPromise(ch) {
  return new Promise(function(resolve, reject) {
    go(function*() {
      try {
        resolve(yield ch);
      }
      catch(e) {
        reject(e);
      }
    });
  });
}

// React utils

function blockFor(name, children) {
  var block;
  React.Children.forEach(children, child => {
    if(child &&
       child.props &&
       child.props.name === name)
      block = child.props.children;
  });
  return block;
}

// now later a store can check `action instanceof AsyncStatus`?

// Assertions

function assert(msg, val) {
  if(val === undefined || val === null || val === false) {
    throw new Error('assertion failure: ' + msg);
  }
}

module.exports = {
  encodeTextContent,
  decodeTextContent,
  prevented,
  slugify,
  mergeObj,
  invokeCallback,
  invokeCallbackM,
  takeArray,
  takeAll,
  toPromise,
  blockFor,
  invariant
};
