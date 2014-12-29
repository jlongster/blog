var csp = require('./csp');
var { go, chan, take, put } = csp;

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
      else {
        c.close();
      }
    });
  });
  func.apply(ctx, args);
  return c;
}

function takeCallback(func /*, args... */) {
  var args = Array.prototype.slice.call(arguments, 1);
  args.unshift(null);
  return takeCallbackM.apply(this, args);
}

function takeCallbackM(ctx, func /*, args... */) {
  var args = Array.prototype.slice.call(arguments, 2);
  args.unshift(func);
  args.unshift(ctx);
  return take(invokeCallbackM.apply(null, args));
}

function pipeChans(chans, out) {
  go(function*() {
    arr = yield takeArray(chans);
    for(var i=0; i<arr.length; i++) {
      yield put(out, arr[i]);
    }
    out.close();
  });
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

function promise(gen) {
  return go(gen, null, true);
}

module.exports = {
  invokeCallback: invokeCallback,
  invokeCallbackM: invokeCallbackM,
  takeCallback: takeCallback,
  takeCallbackM: takeCallbackM,
  pipeChans: pipeChans,
  promise: promise,
  takeAll: takeAll,
  takeArray: takeArray
}
