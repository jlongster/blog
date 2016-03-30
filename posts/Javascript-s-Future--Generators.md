---
shorturl: "Javascript-s-Future--Generators"
tags: ["js"]
published: true
date: "October 5, 2012"
---

# Javascript's Future: Generators


[Javascript 1.7](https://developer.mozilla.org/en-US/docs/JavaScript/New_in_JavaScript/1.7) introduced [generators](https://developer.mozilla.org/en-US/docs/JavaScript/New_in_JavaScript/1.7#Generators) to javascript, the key feature being a new `yield` keyword which suspends execution of a function. From what I understand, generators were an extension to [ES3](http://en.wikipedia.org/wiki/ECMAScript#Versions), implemented in Firefox years ago as Javascript 1.7, but they have been officially approved for [ES6 (Harmony)](http://wiki.ecmascript.org/doku.php?id=harmony:generators) so we will see them in browsers in the next year or two.

Javascript is finally getting some new language-level features, but it takes time to figure out what it really means to use them. Let's explore what `yield` means.

If you're used to Python or Ruby, generators and `yield` are nothing new. It lets you mark points in a function to suspend execution and return a value. Example:

```js
function foo(x) {
    while(true) {
        x = x * 2;
        yield x;
    }
}
```

When you call `foo`, you get back a `Generator` object which has a `next` method.

```js
var g = foo(2);
g.next(); // -> 4
g.next(); // -> 8
g.next(); // -> 16
```

It has a [few other methods](https://developer.mozilla.org/en-US/docs/JavaScript/New_in_JavaScript/1.7#Generators) too, possibly the most interesting being `send` which lets you send values into the generator:

```js
function bar(x) {
    x++;
    var y = yield x;
    yield y/2;
}

var g = bar(1);
g.next(); // -> 2
g.send(8); // -> 4
```

The first `yield` gives back `x` to the first `next` call. But then we call `send` to resume the generator with a value, which is a assigned to `y`, and then it gives back `y/2` as the second value. You can see that `yield` basically represents slots in the function.

## What Does It Mean?

The programming language side of me gets excited about generators, even if they are a very restricted form of continuations <a href="#footnote1">[1]</a>. But the practical side of me questions how much use it will get.

`next` and `send` are pretty low-level. In most cases, generators will be transparently used as iterators in a `for of` loop:

```js
for(var num of foo(5)) {
    // foo gives back a generator and next() is continually
    // called until it stops
}
```

The [`for of`](http://wiki.ecmascript.org/doku.php?id=harmony:iterators) loop is a new iteration construct in ES6 which supports generators and a bunch of other stuff.

This is really just an **optimization**. Instead of heaving to return a full array, you can just return a generator which lazily gives individual values back at each iteration. This reduces memory and allocation. Since no array allocation is necessary, you can also express infinite data structures.

Another usage is **coroutines**. Since `yield` marks a suspension point, if you write a task manager to interweave the execution of various functions, you get cooperative threading. This is what [task.js](http://taskjs.org/) does.

Coroutines seem like a natural fit for javascript because of its async nature. You might be able to get away with a more direct-style of coding while keeping async goodness.

This is how it would look in node.js:

```js
spawn(function() {
    var item1 = yield db.get('item1');
    var item2 = yield db.get('item2');    
    // do stuff with item1 and item2
});
```

This is very promising. `spawn` hands control of the function over to the scheduler, which assumes the function will `yield` promises and will send the values back once the promises are fulfilled. 

I initially thought that generators could impact node.js' [stream](http://nodejs.org/api/stream.html) library. However, it's important to note that streams allow the event loop to run between iterations, and `yield` doesn't. You need a task manager like task.js if you want something more event loop friendly.

Even then, I tried converting some stream-based code into task.js and it wasn't straight-forward. I'm not sure the use cases are the same. Where task.js could win is simply cleaning up code that uses promises, since it is using promises implicitly, just passing them back and forth with `yield` and the scheduler.

However, I'm not convinced this will take off in the node community, as the win probably isn't big enough. Most people are happy with the current constructs. task.js could possibly improve a lot of front-end code without much work. We'll see.


## Other Uses

I'm sure people smarter than me will find some cool uses for generators. Even though we are used to them in Python and Ruby, the javascript environment is quite different, so there might be some neat applications of it.

It might also make it easier for languages that compile to javascript to implement certain semantics.

## A Task-Based Game

Just for fun, I tweaked a little game engine to use task.js. [Here's a "game" running it](http://jlongster.com/s/task-based/) (you can move the dinasour if he's not stuck). Every single sprite animation is an independent task that [renders itself and sleeps for small time](https://github.com/jlongster/game-engine-studies/blob/master/task-based/resources.js#L62), and loops.

Obviously, it has collision detection problems. The task-based architecture makes it difficult to deterministally check collisions. Just ignore that.

This is *not* a good idea because the overhead of the task-based scheduler hurt performance quite a bit. This isn't surprising, but it was a fun experiment to express the engine differently. It's more modular this way, but the performance cost is too much.

## When Can I Use Generators?

You can use generators in Firefox today, and it should be appearing in other browsers in the next year or two. I asked on the v8-users mailing list and they said that it will ["probably be one of the next major features"](https://groups.google.com/forum/#!msg/v8-users/mV38oWvA2Nk/txtSzVdDhpUJ) in V8. Since it's approved for ES6, which I think is planning to be released at the end of next year, it's not too far off.

I don't think generators will revolutionize anything. I think they are mostly an optimization for iteration, and they might provide interesting opportunities for application code with a lot of async-ness. Even so, I doubt the node community will embrace it. It's a "nice-to-have", but I'm more excited about [other possible features](https://github.com/mozilla/sweet.js).

<sup id="footnote1">
  [1] A generator is like a one-shot continuation that only captures one stack frame. `yield` can only jump up one stack frame above it, which limits its usefulness.
</sup>


