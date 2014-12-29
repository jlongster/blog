"use strict";

var csp = require("./csp");
var chan = csp.chan;
var go = csp.go;
var put = csp.put;
var take = csp.take;

var mocha = require("mocha");
var it = mocha.it;

function identity_chan(x) {
  var ch = chan(1);
  go(regeneratorRuntime.mark(function callee$1$0() {
    return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
      while (true) switch (context$2$0.prev = context$2$0.next) {
        case 0: context$2$0.next = 2;
          return put(ch, x);
        case 2:
          ch.close();
        case 3:
        case "end": return context$2$0.stop();
      }
    }, callee$1$0, this);
  }));
  return ch;
}

// it("", g(function*() {
// }));
function g(f) {
  return function (done) {
    csp.spawn(f(done));
  };
};

function gg(f) {
  return g(regeneratorRuntime.mark(function callee$1$0(done) {
    var ch;
    return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
      while (true) switch (context$2$0.prev = context$2$0.next) {
        case 0: context$2$0.prev = 0;
          ch = go(f, []);
          context$2$0.next = 4;
          return take(ch);
        case 4:
          done();
          context$2$0.next = 10;
          break;
        case 7: context$2$0.prev = 7;
          context$2$0.t0 = context$2$0["catch"](0);
          done(context$2$0.t0);
        case 10:
        case "end": return context$2$0.stop();
      }
    }, callee$1$0, this, [[0, 7]]);
  }));
}

module.exports = {
  identity_chan: identity_chan,
  goAsync: g,
  go: gg,

  it: function (desc, f) {
    return mocha.it(desc, gg(f));
  },

  beforeEach: function (f) {
    return mocha.beforeEach(gg(f));
  },

  afterEach: function (f) {
    return mocha.afterEach(gg(f));
  },

  before: function (f) {
    return mocha.before(gg(f));
  },

  after: function (f) {
    return mocha.after(gg(f));
  }
};