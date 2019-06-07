import { X, Y, Z } from './math';

var LEFT = 2;
var RIGHT = 3;

export function make_heap() {
  return [null, null, null, null];
}

export function heap_add(heap, line) {
  var z = (line[0][Z] + line[1][Z]) / 2.0;
  _heap_insert(heap, line, z);
}

function _heap_insert(heap, line, z) {
  if (!heap[0]) {
    heap[0] = line;
    heap[1] = z;
  } else if (z > heap[1]) {
    if (!heap[LEFT]) {
      heap[LEFT] = [line, z, null, null];
    } else {
      _heap_insert(heap[LEFT], line, z);
    }
  } else {
    if (!heap[RIGHT]) {
      heap[RIGHT] = [line, z, null, null];
    } else {
      _heap_insert(heap[RIGHT], line, z);
    }
  }
}

export function heap_depth_first(heap, func) {
  if (heap[LEFT]) {
    heap_depth_first(heap[LEFT], func);
  }

  if (heap[0]) {
    func(heap[0]);
  }

  if (heap[RIGHT]) {
    heap_depth_first(heap[RIGHT], func);
  }
}
