export var X = 0;
export var Y = 1;
export var Z = 2;
export var W = 3;

export var R = 0;
export var G = 1;
export var B = 2;
export var A = 3;

export function vec(x, y, z, w) {
  var arr;
  var len = w != undefined ? 4 : z != undefined ? 3 : y != undefined ? 2 : 1;

  if (typeof ArrayBuffer !== 'undefined') {
    var buffer = new ArrayBuffer(4 * len);
    arr = new Float32Array(buffer);
  } else {
    arr = [];
  }

  arr[X] = x;
  len >= 2 && (arr[Y] = y);
  len >= 3 && (arr[Z] = z);
  len == 4 && (arr[W] = w);
  return arr;
}

export function vec_equals(v1, v2) {
  function fleq(x, y) {
    if (isNaN(x) && isNaN(y)) return true;

    return Math.abs(x - y) < 0.0000000001;
  }

  return (
    fleq(v1[X], v2[X]) &&
    fleq(v1[Y], v2[Y]) &&
    fleq(v1[Z], v2[Z]) &&
    fleq(v1[W], v2[W])
  );
}

export function vec_copy(v1) {
  if (typeof Float32Array !== 'undefined' && v1 instanceof Float32Array) {
    var buffer = new ArrayBuffer(4 * v1.length);
    var arr = new Float32Array(buffer);
    arr[X] = v1[X];
    arr[Y] = v1[Y];
    arr[Z] = v1[Z];
    arr[W] = v1[W];
    return arr;
  }
  return Array.prototype.slice.call(v1);
}

export function vec_pure_operation(op) {
  return function(v1, v2) {
    v1 = vec_copy(v1);
    op(v1, v2);
    return v1;
  };
}

export function _vec_subtract(v1, v2) {
  v1[X] = v1[X] - v2[X];
  v1.length >= 2 && (v1[Y] = v1[Y] - v2[Y]);
  v1.length >= 3 && (v1[Z] = v1[Z] - v2[Z]);
  v1.length == 4 && (v1[W] = v1[W] - v2[W]);
}
export var vec_subtract = vec_pure_operation(_vec_subtract);

export function _vec_multiply(v1, v2) {
  v1[X] = v1[X] * v2[X];
  v1.length >= 2 && (v1[Y] = v1[Y] * v2[Y]);
  v1.length >= 3 && (v1[Z] = v1[Z] * v2[Z]);
  v1.length == 4 && (v1[W] = v1[W] * v2[W]);
}
export var vec_multiply = vec_pure_operation(_vec_multiply);

export function _vec_add(v1, v2) {
  (v1[X] = v1[X] + v2[X]), v1.length >= 2 && (v1[Y] = v1[Y] + v2[Y]);
  v1.length >= 3 && (v1[Z] = v1[Z] + v2[Z]);
  v1.length == 4 && (v1[W] = v1[W] + v2[W]);
}
export var vec_add = vec_pure_operation(_vec_add);

export function vec_dot(v1, v2) {
  return (
    v1[X] * v2[X] +
    (v1.length >= 2 ? v1[Y] * v2[Y] : 0) +
    (v1.length >= 3 ? v1[Z] * v2[Z] : 0) +
    (v1.length == 4 ? v1[W] * v2[W] : 0)
  );
}

function _vec_cross(v1, v2) {
  if (v1.length < 3) return;

  var x = v1[Y] * v2[Z] - v1[Z] * v2[Y];
  var y = v1[Z] * v2[X] - v1[X] * v2[Z];
  var z = v1[X] * v2[Y] - v1[Y] * v2[X];
  v1[X] = x;
  v1[Y] = y;
  v1[Z] = z;
}
export var vec_cross = vec_pure_operation(_vec_cross);

export function vec_length(v1) {
  return Math.sqrt(
    v1[X] * v1[X] +
      v1[Y] * v1[Y] +
      (v1.length >= 3 ? v1[Z] * v1[Z] : 0) +
      (v1.length == 4 ? v1[W] * v1[W] : 0)
  );
}

function _vec_2drotate(v1, angle) {
  var x = v1[X] * Math.cos(angle) - v1[Y] * Math.sin(angle);
  var y = v1[X] * Math.sin(angle) + v1[Y] * Math.cos(angle);
  v1[X] = x;
  v1[Y] = y;
}
export var vec_2drotate = vec_pure_operation(_vec_2drotate);

export function _vec_3drotateX(v1, angle) {
  var y = v1[Y] * Math.cos(angle) - v1[Z] * Math.sin(angle);
  var z = v1[Y] * Math.sin(angle) + v1[Z] * Math.cos(angle);
  v1[Y] = y;
  v1[Z] = z;
}
export var vec_3drotateX = vec_pure_operation(_vec_3drotateX);

export function _vec_3drotateY(v1, angle) {
  var x = v1[Z] * Math.sin(angle) + v1[X] * Math.cos(angle);
  var z = v1[Z] * Math.cos(angle) - v1[X] * Math.sin(angle);
  v1[X] = x;
  v1[Z] = z;
}
export var vec_3drotateY = vec_pure_operation(_vec_3drotateY);

export function _vec_3drotateZ(v1, angle) {
  var x = v1[X] * Math.cos(angle) - v1[Y] * Math.sin(angle);
  var y = v1[X] * Math.sin(angle) + v1[Y] * Math.cos(angle);
  v1[X] = x;
  v1[Y] = y;
}
export var vec_3drotateZ = vec_pure_operation(_vec_3drotateZ);

function _vec_unit(v1) {
  var len = vec_length(v1);
  v1[X] = v1[X] / len;
  v1[Y] = v1[Y] / len;
  v1[Z] = v1[Z] / len;
}
export var vec_unit = vec_pure_operation(_vec_unit);

// matrix
// TODO: optimize this

export function matrix() {
  return Array.prototype.slice.call(arguments);
}

export function matrix_x(m1, m2) {
  var res = [];

  for (var row = 0; row < m2.length; row++) {
    res[row] = [];

    for (var col = 0; col < m2[row].length; col++) {
      var v1 = [];
      for (var y = 0; y < m2.length; y++) {
        v1.push(m2[y][col]);
      }

      var v2 = m1[row];

      res[row][col] = vec_dot(v1, v2);
    }
  }

  return res;
}

// color

// A color value is the same as vector, just with different element
// names (r, g, b, a).
export var color = vec;

// tests

function assert(msg, exp) {
  if (!exp) throw '[FAILED] ' + msg;
}

function assert_equal(msg, v1, v2) {
  if (typeof v1 == 'object') {
    assert(msg + ' ' + v1 + ' ' + v2, vec_equals(v1, v2));
  } else {
    assert(msg + ' ' + v1 + ' ' + v2, v1 == v2);
  }
}

var x = vec(4, 5, 6);
var y;
var z = vec(2, 3, 4);

assert_equal('vec_subtract', vec_subtract(x, z), vec(2, 2, 2));
assert_equal('vec_add', vec_add(x, z), vec(6, 8, 10));

x = vec(0, 1, 0);
y = vec(1, 0, 0);
assert_equal('vec_dot', vec_dot(x, y), 0);

x = vec(-1, 0, 0);
assert_equal('vec_dot', vec_dot(x, y), -1);

x = vec(1, 1, 0);
y = vec(1.5, 1, 0);
assert_equal('vec_dot', vec_dot(x, y), 2.5);

x = vec(0, 1, 0);
y = vec(1, 0, 0);
assert_equal('vec_cross', vec_cross(x, y), vec(0, 0, -1));

assert_equal('vec_3drotateX', vec_3drotateX(x, Math.PI / 2.0), vec(0, 0, 1));
assert_equal('vec_3drotateY', vec_3drotateY(y, Math.PI / 2.0), vec(0, 0, -1));
assert_equal('vec_3drotateZ', vec_3drotateZ(x, Math.PI / 2.0), vec(-1, 0, 0));
