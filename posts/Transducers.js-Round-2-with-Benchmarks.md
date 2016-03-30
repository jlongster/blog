---
tags: ["transducers"]
published: true
date: "October 12, 2014"
readnext: "Transducers.js--A-JavaScript-Library-for-Transformation-of-Data"
abstract: "Over the past week I've been hard at work polishing and benchmarking my transducers library. I just published a new version with benchmarks so let's take a look at the new features and performance."
shorturl: "Transducers.js-Round-2-with-Benchmarks"
headerimg: ""
---

# Transducers.js Round 2 with Benchmarks

A few weeks ago I released my [transducers library](https://github.com/jlongster/transducers.js) and [explained the algorithm](http://jlongster.com/Transducers.js--A-JavaScript-Library-for-Transformation-of-Data) behind it. It's a wonderfully simple technique for high-performant transformations like map and filter and was created by Clojure (mostly Rich Hickey I think).

Over the past week I've been hard at work polishing and benchmarking it. Today I published version 0.2.0 with a new API and completely refactored internals that make it easy to use and get performance that beats other popular utility libraries. (This is a different library than the [recently released](https://github.com/cognitect-labs/transducers-js) one from Cognitect)

## A Few Benchmarks

Benchmarking is hard, but I think it's worthwhile to post a few of them that backs up these claims. All of these were run on the latest version of node (0.10.32). First I wanted to prove how transducers devastates many other libraries for large arrays (*update*: lodash + laziness comes the closest, see more in the next section). The test performs two maps and two filters. Here is the transducer code:

```js
into([],
     compose(
       map(function(x) { return x + 10; }),
       map(function(x) { return x * 2; }),
       filter(function(x) { return x % 5 === 0; }),
       filter(function(x) { return x % 2 === 0; })
     ),
     arr);
```

The same transformations were implemented in lodash and underscore, and benchmarked with an `arr` of various sizes. The graph below shows the time it took to run versus the size of `arr`, which starts at 500 and goes up to around 300,000. Here's [the full benchmark](https://github.com/jlongster/transducers.js/blob/master/bench/bench.js) (it outputs Hz so the y-axis is 1/Hz).

![](http://jlongster.com/s/trans-bench1.png)

Once the array reaches around the size of 90,000, transducers completely blow the competition away. This should be obvious; we *never* need to allocate anything between transformations, while underscore and lodash always have to allocation an intermediate array.

Laziness would not help here, since we are eagerly evaluating the whole array.

### Update: More Detailed Benchmark

*This section was added after requests for a more thorough benchmark, particularly including lodash's new lazy behavior*

The master branch of lodash supports laziness, which should provide performance gains. Let's include that in the benchmark to see how well it helps. Laziness is a technique where a chain doesn't evaluate the transformations until a final `value` method is called, and it attempts to reduce intermediate allocations. Here's the [full benchmark](https://github.com/jlongster/transducers.js/blob/master/bench/bench.js) that generated the following graph.

We also added comparisons with native `map` and `filter`, and a baseline that manually performs the same operations in a `for` loop (thanks [@stefanpenner](https://twitter.com/stefanpenner) for that).

![](http://jlongster.com/s/trans-bench2.png)

First, as expected the baseline performs the best. But the cost of transducers isn't too bad, and you get a far better and easier to use abstraction than manually hand-coding `for` loops. Unfortunately, native is slowest for various reasons.

The real interesting thing is that the laziness of lodash does help it out a lot. For some reason there's still a jump, but it's at a much higher point, around 280,000 items. In general transducers take about 2/3rds of the time though, and the performance is more consistent. Note that for there's actually a perf hit for lodash laziness for smaller arrays under 90,000.

This benchmark was run with node 0.10.32, and it most likely looks different on various engines. Transducers don't beat a lazy lodash as much (for some array sizes not at all) in Firefox, but *I think* that's more due to poor optimization in Firefox. The algorithm is inherently open to great optimizations as the process is only a few functions calls per item, so I think it will only get better across each engine. My guess is that Firefox needs to do a better job inlining functions, but I still need to look into it.

### Small Arrays

While it's not as  dramatic, even with arrays as small as 1000 you will see performance wins. Here is the same benchmarks but only running it twice with a size of 1000 and 10,000:

```
_.map/filter (1000) x 22,302 ops/sec ±0.90% (100 runs sampled)
u.map/filter (1000) x 21,290 ops/sec ±0.65% (96 runs sampled)
t.map/filter+transduce (1000) x 26,638 ops/sec ±0.77% (98 runs sampled)

_.map/filter (10000) x 2,277 ops/sec ±0.49% (101 runs sampled)
u.map/filter (10000) x 2,155 ops/sec ±0.77% (99 runs sampled)
t.map/filter+transduce (10000) x 2,832 ops/sec ±0.44% (99 runs sampled)
```

### Take

If you use the `take` operation to only take, say, 10 items, transducers will only send 10 items through the transformation pipeline. <strike>Obviously if I ran benchmarks we would also blow away lodash and underscore here because they do not lazily optimize for `take` (and transform all the array first and then runs `take`).</strike> You can do this in some of the other libraries like lodash with explicitly marking a chain as lazy and then requesting the value at the end. We get this for free though, and still beat it in this scenario because we don't have any laziness machinery.

I ran a benchmark here but I don't have it anymore, but it's worth noting that we don't need to be explicitly lazy to optimize for `take`.

### immutable-js

The [immutable-js](https://github.com/facebook/immutable-js) library is fantastic collection of immutable data structures. They implement lazy transformations so you get a lot of perf wins with that. Even so, there is a cost to the laziness machinery. I implemented the same map->map->filter->filter transformation above in [another benchmark](https://github.com/jlongster/transducers.js/blob/master/bench/immut.js) which compares it with their transformations. Here is the output with `arr` sizes of 1000 and 100,000:

```
Immutable map/filter (1000) x 6,414 ops/sec ±0.95% (99 runs sampled)
transducer map/filter (1000) x 7,119 ops/sec ±1.58% (96 runs sampled)

Immutable map/filter (100000) x 67.77 ops/sec ±0.95% (72 runs sampled)
transducer map/filter (100000) x 79.23 ops/sec ±0.47% (69 runs sampled)
```

This kind of perf win isn't a huge deal, and their transformations perform well. But we can apply this to any data structure. Did you notice how easy it was to use our library with immutable-js? View the full benchmark [here](https://github.com/jlongster/transducers.js/blob/master/bench/immut.js).

## Transducers.js Refactored

I just pushed v0.2.0 to npm with all the new APIs and performance improvements. Read more in [the new docs](https://github.com/jlongster/transducers.js).

You may have noticed the Cognitect, where Rich Hickey and other core maintainers of Clojure(Script) work, released [their own](https://github.com/cognitect-labs/transducers-js) JavaScript transducers library on Friday. I was a little bummed because I had just spent a lot of time refactoring mine, but I think I offer a few improvements. Internally, we basically converged on the exact same technique for implementing transducers, so you should find the same performance characteristics above with their library.

All of the following features are things you can find in my library [transducers.js](https://github.com/jlongster/transducers.js).

My library now offers several integration points for using transducers:

* `seq` takes a collection and a transformer and returns a collection of the same type. If you pass it an array, you will get back an array. An iterator will give you back an iterator. For example:

```js
// Filter an array
seq([1, 2, 3], filter(x => x > 1));
// -> [ 2, 3 ]

// Map an object
seq({ foo: 1, bar: 2 }, map(kv => [kv[0], kv[1] + 1]));
// -> { foo: 2, bar: 3 }

// Lazily transform an iterable
function* nums() {
  var i = 1;
  while(true) {
    yield i++;
  }
}

var iter = seq(nums(), compose(map(x => x * 2),
                               filter(x => x > 4));
iter.next().value; // -> 6
iter.next().value; // -> 8
iter.next().value; // -> 10
```

* `toArray`, `toObject`, and `toIter` will take any iterable type and force them into the type that you requested. Each of these can optionally take a transform as the second argument.

```js
// Make an array from an object
toArray({ foo: 1, bar: 2 });
// -> [ [ 'foo', 1 ], [ 'bar', 2 ] ]

// Make an array from an iterable
toArray(nums(), take(3));
// -> [ 1, 2, 3 ]
```

That's a very quick overview, and you can read more about these in [the docs](https://github.com/jlongster/transducers.js#applying-transformations).

## Collections as Arguments

All the transformations in transducers.js optionally take a collection as the first argument, so the familiar pattern of `map(coll, function(x) { return x + 1; })` still works fine. This is an extremely common use case so this will be very helpful if you are transitioning from another library. You can also pass a `context` as the third argument to specify what `this` should be bound to.

[Read more](https://github.com/jlongster/transducers.js#transformations) about the various ways to use transformations.

## Laziness

Transducers remove the requirement of being lazy to optimize for things like `take(10)`. However, it can still be useful to "bind" a collection to a set of transformations and pass it around, without actually evaluating the transformations. It's also useful if you want to apply transformations to a custom data type, get an iterator back, and rebuild another custom data type from it (there is still no intermediate array).

Whenever you apply transformations to an iterator it does so lazily. It's easy to convert array transformations into a lazy operation, just use the utility function `iterator` to grab an iterator of the array instead:

```js
seq(iterator([1, 2, 3]),
    compose(
      map(x => x + 1),
      filter(x => x % 2 === 0)))
// -> <Iterator>
```

Our transformations are completely blind to the fact that our transformations may or may not be lazy.

## The `transformer` Protocol

Lastly, [transducers.js](https://github.com/jlongster/transducers.js) supports a new protocol that I call the `transformer` protocol. If a custom data structure implements this, not only can we iterate over it in functions like `seq`, but we can also build up a new instance. That means `seq` won't return an iterator, but it will return an *actual* instance.

For example, here's how you would implement it in `Immutable.Vector`:

```js
var t = require('./transducers');
Immutable.Vector.prototype[t.protocols.transformer] = {
  init: function() {
    return Immutable.Vector().asMutable();
  },
  result: function(vec) {
    return vec.asImmutable();
  },
  step: function(vec, x) {
    return vec.push(x);
  }
};
```

If you implement the transformer protocol, now your data structure will work with all of the builtin functions. You can just use seq like normal and you get back an immutable vector!

```js
t.seq(Immutable.Vector(1, 2, 3, 4, 5),
      t.compose(
        t.map(function(x) { return x + 10; }),
        t.map(function(x) { return x * 2; }),
        t.filter(function(x) { return x % 5 === 0; }),
        t.filter(function(x) { return x % 2 === 0; })));
// -> Vector [ 30 ]
```

I hope you give transducers a try, they are really fun! And unlike Cognitect's project, mine is happy to receive [pull requests](https://github.com/jlongster/transducers.js). :)

<style type="text/css">.post article > p:first-of-type { font-size: 1em; } .post article img { border: 2px solid #666666; margin-top: 2.5em; margin-bottom: 2.5em; }</style>