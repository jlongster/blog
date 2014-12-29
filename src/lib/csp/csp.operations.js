"use strict";

var mapcat = regeneratorRuntime.mark(function mapcat(f, src, dst) {
  var value, seq, length, i;
  return regeneratorRuntime.wrap(function mapcat$(context$1$0) {
    while (true) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        if (!true) {
          context$1$0.next = 22;
          break;
        }
        context$1$0.next = 3;
        return take(src);
      case 3: value = context$1$0.sent;
        if (!(value === CLOSED)) {
          context$1$0.next = 9;
          break;
        }
        dst.close();
        return context$1$0.abrupt("break", 22);
      case 9: seq = f(value);
        length = seq.length;
        i = 0;
      case 12:
        if (!(i < length)) {
          context$1$0.next = 18;
          break;
        }
        context$1$0.next = 15;
        return put(dst, seq[i]);
      case 15: i++;
        context$1$0.next = 12;
        break;
      case 18:
        if (!dst.is_closed()) {
          context$1$0.next = 20;
          break;
        }
        return context$1$0.abrupt("break", 22);
      case 20: context$1$0.next = 0;
        break;
      case 22:
      case "end": return context$1$0.stop();
    }
  }, mapcat, this);
});

var Box = require("./impl/channels").Box;

var csp = require("./csp.core"), go = csp.go, spawn = csp.spawn, take = csp.take, put = csp.put, takeAsync = csp.takeAsync, putAsync = csp.putAsync, alts = csp.alts, chan = csp.chan, CLOSED = csp.CLOSED;


function mapFrom(f, ch) {
  return {
    is_closed: function () {
      return ch.is_closed();
    },
    close: function () {
      ch.close();
    },
    _put: function (value, handler) {
      return ch._put(value, handler);
    },
    _take: function (handler) {
      var result = ch._take({
        is_active: function () {
          return handler.is_active();
        },
        commit: function () {
          var take_cb = handler.commit();
          return function (value) {
            return take_cb(value === CLOSED ? CLOSED : f(value));
          };
        }
      });
      if (result) {
        var value = result.value;
        return new Box(value === CLOSED ? CLOSED : f(value));
      } else {
        return null;
      }
    }
  };
}

function mapInto(f, ch) {
  return {
    is_closed: function () {
      return ch.is_closed();
    },
    close: function () {
      ch.close();
    },
    _put: function (value, handler) {
      return ch._put(f(value), handler);
    },
    _take: function (handler) {
      return ch._take(handler);
    }
  };
}

function filterFrom(p, ch, bufferOrN) {
  var out = chan(bufferOrN);
  go(regeneratorRuntime.mark(function callee$1$0() {
    var value;
    return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
      while (true) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          if (!true) {
            context$2$0.next = 12;
            break;
          }
          context$2$0.next = 3;
          return take(ch);
        case 3: value = context$2$0.sent;
          if (!(value === CLOSED)) {
            context$2$0.next = 7;
            break;
          }
          out.close();
          return context$2$0.abrupt("break", 12);
        case 7:
          if (!p(value)) {
            context$2$0.next = 10;
            break;
          }
          context$2$0.next = 10;
          return put(out, value);
        case 10: context$2$0.next = 0;
          break;
        case 12:
        case "end": return context$2$0.stop();
      }
    }, callee$1$0, this);
  }));
  return out;
}

function filterInto(p, ch) {
  return {
    is_closed: function () {
      return ch.is_closed();
    },
    close: function () {
      ch.close();
    },
    _put: function (value, handler) {
      if (p(value)) {
        return ch._put(value, handler);
      } else {
        return new Box(!ch.is_closed());
      }
    },
    _take: function (handler) {
      return ch._take(handler);
    }
  };
}

function removeFrom(p, ch) {
  return filterFrom(function (value) {
    return !p(value);
  }, ch);
}

function removeInto(p, ch) {
  return filterInto(function (value) {
    return !p(value);
  }, ch);
}

function mapcatFrom(f, ch, bufferOrN) {
  var out = chan(bufferOrN);
  spawn(mapcat(f, ch, out));
  return out;
}

function mapcatInto(f, ch, bufferOrN) {
  var src = chan(bufferOrN);
  spawn(mapcat(f, src, ch));
  return src;
}

function pipe(src, dst, keepOpen) {
  go(regeneratorRuntime.mark(function callee$1$0() {
    var value;
    return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
      while (true) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          if (!true) {
            context$2$0.next = 13;
            break;
          }
          context$2$0.next = 3;
          return take(src);
        case 3: value = context$2$0.sent;
          if (!(value === CLOSED)) {
            context$2$0.next = 7;
            break;
          }
          if (!keepOpen) {
            dst.close();
          }
          return context$2$0.abrupt("break", 13);
        case 7: context$2$0.next = 9;
          return put(dst, value);
        case 9:
          if (context$2$0.sent) {
            context$2$0.next = 11;
            break;
          }
          return context$2$0.abrupt("break", 13);
        case 11: context$2$0.next = 0;
          break;
        case 13:
        case "end": return context$2$0.stop();
      }
    }, callee$1$0, this);
  }));
  return dst;
}

function split(p, ch, trueBufferOrN, falseBufferOrN) {
  var tch = chan(trueBufferOrN);
  var fch = chan(falseBufferOrN);
  go(regeneratorRuntime.mark(function callee$1$0() {
    var value;
    return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
      while (true) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          if (!true) {
            context$2$0.next = 12;
            break;
          }
          context$2$0.next = 3;
          return take(ch);
        case 3: value = context$2$0.sent;
          if (!(value === CLOSED)) {
            context$2$0.next = 8;
            break;
          }
          tch.close();
          fch.close();
          return context$2$0.abrupt("break", 12);
        case 8: context$2$0.next = 10;
          return put(p(value) ? tch : fch, value);
        case 10: context$2$0.next = 0;
          break;
        case 12:
        case "end": return context$2$0.stop();
      }
    }, callee$1$0, this);
  }));
  return [tch, fch];
}

function reduce(f, init, ch) {
  return go(regeneratorRuntime.mark(function callee$1$0() {
    var result, value;
    return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
      while (true) switch (context$2$0.prev = context$2$0.next) {
        case 0: result = init;
        case 1:
          if (!true) {
            context$2$0.next = 12;
            break;
          }
          context$2$0.next = 4;
          return take(ch);
        case 4: value = context$2$0.sent;
          if (!(value === CLOSED)) {
            context$2$0.next = 9;
            break;
          }
          return context$2$0.abrupt("return", result);
        case 9:
          result = f(result, value);
        case 10: context$2$0.next = 1;
          break;
        case 12:
        case "end": return context$2$0.stop();
      }
    }, callee$1$0, this);
  }), [], true);
}

function onto(ch, coll, keepOpen) {
  return go(regeneratorRuntime.mark(function callee$1$0() {
    var length, i;
    return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
      while (true) switch (context$2$0.prev = context$2$0.next) {
        case 0: length = coll.length;
          i = 0;
        case 2:
          if (!(i < length)) {
            context$2$0.next = 8;
            break;
          }
          context$2$0.next = 5;
          return put(ch, coll[i]);
        case 5: i++;
          context$2$0.next = 2;
          break;
        case 8:
          if (!keepOpen) {
            ch.close();
          }
        case 9:
        case "end": return context$2$0.stop();
      }
    }, callee$1$0, this);
  }));
}

// TODO: Bounded?
function fromColl(coll) {
  var ch = chan(coll.length);
  onto(ch, coll);
  return ch;
}

function map(f, chs, bufferOrN) {
  var out = chan(bufferOrN);
  var length = chs.length;
  // Array holding 1 round of values
  var values = new Array(length);
  // TODO: Not sure why we need a size-1 buffer here
  var dchan = chan(1);
  // How many more items this round
  var dcount;
  // put callbacks for each channel
  var dcallbacks = new Array(length);
  for (var i = 0; i < length; i++) {
    dcallbacks[i] = (function (i) {
      return function (value) {
        values[i] = value;
        dcount--;
        if (dcount === 0) {
          putAsync(dchan, values.slice(0));
        }
      };
    }(i));
  }
  go(regeneratorRuntime.mark(function callee$1$0() {
    var i, values;
    return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
      while (true) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          if (!true) {
            context$2$0.next = 18;
            break;
          }
          dcount = length;
          // We could just launch n goroutines here, but for effciency we
          // don't
          for (i = 0; i < length; i++) {
            try {
              takeAsync(chs[i], dcallbacks[i]);
            } catch (e) {
              // FIX: Hmm why catching here?
              dcount--;
            }
          }
          context$2$0.next = 5;
          return take(dchan);
        case 5: values = context$2$0.sent;
          i = 0;
        case 7:
          if (!(i < length)) {
            context$2$0.next = 14;
            break;
          }
          if (!(values[i] === CLOSED)) {
            context$2$0.next = 11;
            break;
          }
          out.close();
          return context$2$0.abrupt("return");
        case 11: i++;
          context$2$0.next = 7;
          break;
        case 14: context$2$0.next = 16;
          return put(out, f.apply(null, values));
        case 16: context$2$0.next = 0;
          break;
        case 18:
        case "end": return context$2$0.stop();
      }
    }, callee$1$0, this);
  }));
  return out;
}

function merge(chs, bufferOrN) {
  var out = chan(bufferOrN);
  var actives = chs.slice(0);
  go(regeneratorRuntime.mark(function callee$1$0() {
    var r, value, i;
    return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
      while (true) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          if (!true) {
            context$2$0.next = 15;
            break;
          }
          if (!(actives.length === 0)) {
            context$2$0.next = 3;
            break;
          }
          return context$2$0.abrupt("break", 15);
        case 3: context$2$0.next = 5;
          return alts(actives);
        case 5: r = context$2$0.sent;
          value = r.value;
          if (!(value === CLOSED)) {
            context$2$0.next = 11;
            break;
          }
          i = actives.indexOf(r.channel);
          actives.splice(i, 1);
          return context$2$0.abrupt("continue", 0);
        case 11: context$2$0.next = 13;
          return put(out, value);
        case 13: context$2$0.next = 0;
          break;
        case 15:
          out.close();
        case 16:
        case "end": return context$2$0.stop();
      }
    }, callee$1$0, this);
  }));
  return out;
}

function into(coll, ch) {
  var result = coll.slice(0);
  return reduce(function (result, item) {
    result.push(item);
    return result;
  }, result, ch);
}

function takeN(n, ch, bufferOrN) {
  var out = chan(bufferOrN);
  go(regeneratorRuntime.mark(function callee$1$0() {
    var i, value;
    return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
      while (true) switch (context$2$0.prev = context$2$0.next) {
        case 0: i = 0;
        case 1:
          if (!(i < n)) {
            context$2$0.next = 12;
            break;
          }
          context$2$0.next = 4;
          return take(ch);
        case 4: value = context$2$0.sent;
          if (!(value === CLOSED)) {
            context$2$0.next = 7;
            break;
          }
          return context$2$0.abrupt("break", 12);
        case 7: context$2$0.next = 9;
          return put(out, value);
        case 9: i++;
          context$2$0.next = 1;
          break;
        case 12:
          out.close();
        case 13:
        case "end": return context$2$0.stop();
      }
    }, callee$1$0, this);
  }));
  return out;
}

var NOTHING = {};

function unique(ch, bufferOrN) {
  var out = chan(bufferOrN);
  var last = NOTHING;
  go(regeneratorRuntime.mark(function callee$1$0() {
    var value;
    return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
      while (true) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          if (!true) {
            context$2$0.next = 13;
            break;
          }
          context$2$0.next = 3;
          return take(ch);
        case 3: value = context$2$0.sent;
          if (!(value === CLOSED)) {
            context$2$0.next = 6;
            break;
          }
          return context$2$0.abrupt("break", 13);
        case 6:
          if (!(value === last)) {
            context$2$0.next = 8;
            break;
          }
          return context$2$0.abrupt("continue", 0);
        case 8:
          last = value;
          context$2$0.next = 11;
          return put(out, value);
        case 11: context$2$0.next = 0;
          break;
        case 13:
          out.close();
        case 14:
        case "end": return context$2$0.stop();
      }
    }, callee$1$0, this);
  }));
  return out;
}

function partitionBy(f, ch, bufferOrN) {
  var out = chan(bufferOrN);
  var part = [];
  var last = NOTHING;
  go(regeneratorRuntime.mark(function callee$1$0() {
    var value, newItem;
    return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
      while (true) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          if (!true) {
            context$2$0.next = 23;
            break;
          }
          context$2$0.next = 3;
          return take(ch);
        case 3: value = context$2$0.sent;
          if (!(value === CLOSED)) {
            context$2$0.next = 12;
            break;
          }
          if (!(part.length > 0)) {
            context$2$0.next = 8;
            break;
          }
          context$2$0.next = 8;
          return put(out, part);
        case 8:
          out.close();
          return context$2$0.abrupt("break", 23);
        case 12: newItem = f(value);
          if (!(newItem === last || last === NOTHING)) {
            context$2$0.next = 17;
            break;
          }
          part.push(value);
          context$2$0.next = 20;
          break;
        case 17: context$2$0.next = 19;
          return put(out, part);
        case 19:
          part = [value];
        case 20:
          last = newItem;
        case 21: context$2$0.next = 0;
          break;
        case 23:
        case "end": return context$2$0.stop();
      }
    }, callee$1$0, this);
  }));
  return out;
}

function partition(n, ch, bufferOrN) {
  var out = chan(bufferOrN);
  go(regeneratorRuntime.mark(function callee$1$0() {
    var part, i, value;
    return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
      while (true) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          if (!true) {
            context$2$0.next = 21;
            break;
          }
          part = new Array(n);
          i = 0;
        case 3:
          if (!(i < n)) {
            context$2$0.next = 17;
            break;
          }
          context$2$0.next = 6;
          return take(ch);
        case 6: value = context$2$0.sent;
          if (!(value === CLOSED)) {
            context$2$0.next = 13;
            break;
          }
          if (!(i > 0)) {
            context$2$0.next = 11;
            break;
          }
          context$2$0.next = 11;
          return put(out, part.slice(0, i));
        case 11:
          out.close();
          return context$2$0.abrupt("return");
        case 13:
          part[i] = value;
        case 14: i++;
          context$2$0.next = 3;
          break;
        case 17: context$2$0.next = 19;
          return put(out, part);
        case 19: context$2$0.next = 0;
          break;
        case 21:
        case "end": return context$2$0.stop();
      }
    }, callee$1$0, this);
  }));
  return out;
}

// For channel identification
var genId = (function () {
  var i = 0;
  return function () {
    i++;
    return "" + i;
  };
})();

var ID_ATTR = "__csp_channel_id";

// TODO: Do we need to check with hasOwnProperty?
function len(obj) {
  var count = 0;
  for (var p in obj) {
    count++;
  }
  return count;
}

function chanId(ch) {
  var id = ch[ID_ATTR];
  if (id === undefined) {
    id = ch[ID_ATTR] = genId();
  }
  return id;
}

var Mult = function (ch) {
  this.taps = {};
  this.ch = ch;
};

var Tap = function (channel, keepOpen) {
  this.channel = channel;
  this.keepOpen = keepOpen;
};

Mult.prototype.muxch = function () {
  return this.ch;
};

Mult.prototype.tap = function (ch, keepOpen) {
  var id = chanId(ch);
  this.taps[id] = new Tap(ch, keepOpen);
};

Mult.prototype.untap = function (ch) {
  delete this.taps[chanId(ch)];
};

Mult.prototype.untapAll = function () {
  this.taps = {};
};

function mult(ch) {
  var m = new Mult(ch);
  var dchan = chan(1);
  var dcount;
  function makeDoneCallback(tap) {
    return function (stillOpen) {
      dcount--;
      if (dcount === 0) {
        putAsync(dchan, true);
      }
      if (!stillOpen) {
        m.untap(tap.channel);
      }
    };
  }
  go(regeneratorRuntime.mark(function callee$1$0() {
    var value, id, t, taps, initDcount;
    return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
      while (true) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          if (!true) {
            context$2$0.next = 17;
            break;
          }
          context$2$0.next = 3;
          return take(ch);
        case 3: value = context$2$0.sent;
          taps = m.taps;
          if (!(value === CLOSED)) {
            context$2$0.next = 9;
            break;
          }
          for (id in taps) {
            t = taps[id];
            if (!t.keepOpen) {
              t.channel.close();
            }
          }
          // TODO: Is this necessary?
          m.untapAll();
          return context$2$0.abrupt("break", 17);
        case 9:
          dcount = len(taps);
          initDcount = dcount;
          // Put value on tapping channels...
          for (id in taps) {
            t = taps[id];
            putAsync(t.channel, value, makeDoneCallback(t));
          }
          if (!(initDcount > 0)) {
            context$2$0.next = 15;
            break;
          }
          context$2$0.next = 15;
          return take(dchan);
        case 15: context$2$0.next = 0;
          break;
        case 17:
        case "end": return context$2$0.stop();
      }
    }, callee$1$0, this);
  }));
  return m;
}

mult.tap = function tap(m, ch, keepOpen) {
  m.tap(ch, keepOpen);
  return ch;
};

mult.untap = function untap(m, ch) {
  m.untap(ch);
};

mult.untapAll = function untapAll(m) {
  m.untapAll();
};

var Mix = function (ch) {
  this.ch = ch;
  this.stateMap = {};
  this.change = chan();
  this.soloMode = mix.MUTE;
};

Mix.prototype._changed = function () {
  putAsync(this.change, true);
};

Mix.prototype._getAllState = function () {
  var allState = {};
  var stateMap = this.stateMap;
  var solos = [];
  var mutes = [];
  var pauses = [];
  var reads;
  for (var id in stateMap) {
    var chanData = stateMap[id];
    var state = chanData.state;
    var channel = chanData.channel;
    if (state[mix.SOLO]) {
      solos.push(channel);
    }
    // TODO
    if (state[mix.MUTE]) {
      mutes.push(channel);
    }
    if (state[mix.PAUSE]) {
      pauses.push(channel);
    }
  }
  var i, n;
  if (this.soloMode === mix.PAUSE && solos.length > 0) {
    n = solos.length;
    reads = new Array(n + 1);
    for (i = 0; i < n; i++) {
      reads[i] = solos[i];
    }
    reads[n] = this.change;
  } else {
    reads = [];
    for (id in stateMap) {
      chanData = stateMap[id];
      channel = chanData.channel;
      if (pauses.indexOf(channel) < 0) {
        reads.push(channel);
      }
    }
    reads.push(this.change);
  }

  return {
    solos: solos,
    mutes: mutes,
    reads: reads
  };
};

Mix.prototype.admix = function (ch) {
  this.stateMap[chanId(ch)] = {
    channel: ch,
    state: {}
  };
  this._changed();
};

Mix.prototype.unmix = function (ch) {
  delete this.stateMap[chanId(ch)];
  this._changed();
};

Mix.prototype.unmixAll = function () {
  this.stateMap = {};
  this._changed();
};

Mix.prototype.toggle = function (updateStateList) {
  // [[ch1, {}], [ch2, {solo: true}]];
  var length = updateStateList.length;
  for (var i = 0; i < length; i++) {
    var ch = updateStateList[i][0];
    var id = chanId(ch);
    var updateState = updateStateList[i][1];
    var chanData = this.stateMap[id];
    if (!chanData) {
      chanData = this.stateMap[id] = {
        channel: ch,
        state: {}
      };
    }
    for (var mode in updateState) {
      chanData.state[mode] = updateState[mode];
    }
  }
  this._changed();
};

Mix.prototype.setSoloMode = function (mode) {
  if (VALID_SOLO_MODES.indexOf(mode) < 0) {
    throw new Error("Mode must be one of: ", VALID_SOLO_MODES.join(", "));
  }
  this.soloMode = mode;
  this._changed();
};

function mix(out) {
  var m = new Mix(out);
  go(regeneratorRuntime.mark(function callee$1$0() {
    var state, result, value, channel, solos, stillOpen;
    return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
      while (true) switch (context$2$0.prev = context$2$0.next) {
        case 0: state = m._getAllState();
        case 1:
          if (!true) {
            context$2$0.next = 23;
            break;
          }
          context$2$0.next = 4;
          return alts(state.reads);
        case 4: result = context$2$0.sent;
          value = result.value;
          channel = result.channel;
          if (!(value === CLOSED)) {
            context$2$0.next = 11;
            break;
          }
          delete m.stateMap[chanId(channel)];
          state = m._getAllState();
          return context$2$0.abrupt("continue", 1);
        case 11:
          if (!(channel === m.change)) {
            context$2$0.next = 14;
            break;
          }
          state = m._getAllState();
          return context$2$0.abrupt("continue", 1);
        case 14: solos = state.solos;
          if (!(solos.indexOf(channel) > -1 || (solos.length && !(m.mutes.indexOf(channel) > -1)))) {
            context$2$0.next = 21;
            break;
          }
          context$2$0.next = 18;
          return put(out, value);
        case 18: stillOpen = context$2$0.sent;
          if (stillOpen) {
            context$2$0.next = 21;
            break;
          }
          return context$2$0.abrupt("break", 23);
        case 21: context$2$0.next = 1;
          break;
        case 23:
        case "end": return context$2$0.stop();
      }
    }, callee$1$0, this);
  }));
  return m;
}

mix.MUTE = "mute";
mix.PAUSE = "pause";
mix.SOLO = "solo";
var VALID_SOLO_MODES = [mix.MUTE, mix.PAUSE];

mix.add = function admix(m, ch) {
  m.admix(ch);
};

mix.remove = function unmix(m, ch) {
  m.unmix(ch);
};

mix.removeAll = function unmixAll(m) {
  m.unmixAll();
};

mix.toggle = function toggle(m, updateStateList) {
  m.toggle(updateStateList);
};

mix.setSoloMode = function setSoloMode(m, mode) {
  m.setSoloMode(mode);
};

function constantlyNull() {
  return null;
}

var Pub = function (ch, topicFn, bufferFn) {
  this.ch = ch;
  this.topicFn = topicFn;
  this.bufferFn = bufferFn;
  this.mults = {};
};

Pub.prototype._ensureMult = function (topic) {
  var m = this.mults[topic];
  var bufferFn = this.bufferFn;
  if (!m) {
    m = this.mults[topic] = mult(chan(bufferFn(topic)));
  }
  return m;
};

Pub.prototype.sub = function (topic, ch, keepOpen) {
  var m = this._ensureMult(topic);
  return mult.tap(m, ch, keepOpen);
};

Pub.prototype.unsub = function (topic, ch) {
  var m = this.mults[topic];
  if (m) {
    mult.untap(m, ch);
  }
};

Pub.prototype.unsubAll = function (topic) {
  if (topic === undefined) {
    this.mults = {};
  } else {
    delete this.mults[topic];
  }
};

function pub(ch, topicFn, bufferFn) {
  bufferFn = bufferFn || constantlyNull;
  var p = new Pub(ch, topicFn, bufferFn);
  go(regeneratorRuntime.mark(function callee$1$0() {
    var value, mults, topic, m, stillOpen;
    return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
      while (true) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          if (!true) {
            context$2$0.next = 17;
            break;
          }
          context$2$0.next = 3;
          return take(ch);
        case 3: value = context$2$0.sent;
          mults = p.mults;
          if (!(value === CLOSED)) {
            context$2$0.next = 8;
            break;
          }
          for (topic in mults) {
            mults[topic].muxch().close();
          }
          return context$2$0.abrupt("break", 17);
        case 8:
          // TODO: Somehow ensure/document that this must return a string
          // (otherwise use proper (hash)maps)
          topic = topicFn(value);
          m = mults[topic];
          if (!m) {
            context$2$0.next = 15;
            break;
          }
          context$2$0.next = 13;
          return put(m.muxch(), value);
        case 13: stillOpen = context$2$0.sent;
          if (!stillOpen) {
            delete mults[topic];
          }
        case 15: context$2$0.next = 0;
          break;
        case 17:
        case "end": return context$2$0.stop();
      }
    }, callee$1$0, this);
  }));
  return p;
}

pub.sub = function sub(p, topic, ch, keepOpen) {
  return p.sub(topic, ch, keepOpen);
};

pub.unsub = function unsub(p, topic, ch) {
  p.unsub(topic, ch);
};

pub.unsubAll = function unsubAll(p, topic) {
  p.unsubAll(topic);
};

module.exports = {
  mapFrom: mapFrom,
  mapInto: mapInto,
  filterFrom: filterFrom,
  filterInto: filterInto,
  removeFrom: removeFrom,
  removeInto: removeInto,
  mapcatFrom: mapcatFrom,
  mapcatInto: mapcatInto,

  pipe: pipe,
  split: split,
  reduce: reduce,
  onto: onto,
  fromColl: fromColl,

  map: map,
  merge: merge,
  into: into,
  take: takeN,
  unique: unique,
  partition: partition,
  partitionBy: partitionBy,

  mult: mult,
  mix: mix,
  pub: pub
};


// Possible "fluid" interfaces:

// thread(
//   [fromColl, [1, 2, 3, 4]],
//   [mapFrom, inc],
//   [into, []]
// )

// thread(
//   [fromColl, [1, 2, 3, 4]],
//   [mapFrom, inc, _],
//   [into, [], _]
// )

// wrap()
//   .fromColl([1, 2, 3, 4])
//   .mapFrom(inc)
//   .into([])
//   .unwrap();