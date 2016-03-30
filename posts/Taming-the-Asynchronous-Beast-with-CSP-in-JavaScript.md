---
tags: ["rebuild","csp"]
published: true
date: "September 8, 2014"
readnext: "Removing-User-Interface-Complexity,-or-Why-React-is-Awesome"
abstract: "Every piece of software deals with complex control flow mechanisms like callbacks, promises, events, and streams. It turns out using CSP which leverages channels for asynchronous communication vastly reduces the complexity of everything. This has drastic effects not only on server-side code, but also on user interfaces."
shorturl: "Taming-the-Asynchronous-Beast-with-CSP-in-JavaScript"
headerimg: ""
---

# Taming the Asynchronous Beast with CSP Channels in JavaScript	

*This is an entry in a series about rebuilding my custom blog with react, CSP, and other modern tech. [Read more](http://jlongster.com/tag/rebuild) in the blog rebuild series.*

Every piece of software deals with complex control flow mechanisms like callbacks, promises, events, and streams. Some require simple asynchronous coordination, others processing of event or stream-based data, and many deal with both. Your solution to this has a deep impact on your code.

It's not surprising that a multitude of solutions exist. Callbacks are a dumb simple way for passing single values around asynchronously, and promises are a more refined solution to the same problem. Event emitters and streams allow asynchronous handling of multiple values. [FRP](http://en.wikipedia.org/wiki/Functional_reactive_programming) is a different approach which tackles streams and events more elegantly, but isn't as good at asynchronous coordination. It can be overwhelming just to know where to start in all of this.

I think things can be simplified to a single abstraction since the underlying problem to all of this is the same. I present to you [CSP](http://en.wikipedia.org/wiki/Communicating_sequential_processes) and the concept of *channels*. CSP has been highly influential in [Go](http://golang.org/) and recently Clojure embraced it as well with [core.async](https://github.com/clojure/core.async/). There's even a [C version](https://github.com/tylertreat/chan). It's safe to say that it's becoming quite popular (and validated) and I think we need to try it out in JavaScript. I'm not going to spend time comparing it with every other solution (promises, FRP) because it would take too long and only incite remarks about how I wasn't using it right. I hope my examples do a good enough job convincing you themselves.

Typically channels are useful for coordinating truly concurrent tasks that might run at the same time on separate threads. They are actually just as useful in a single-threaded environment because they solve a more general problem of coordinating anything *asynchronous*, which is everything in JavaScript.

Two posts you should read in addition to this are David Nolen's [exploration of core.async](http://swannodette.github.io/2013/07/12/communicating-sequential-processes/) and the [core.async announcement](http://clojure.com/blog/2013/06/28/clojure-core-async-channels.html). You will find the rationale behind CSP and clear examples of how powerful channels are.

In this post, I will dive deeply into how we can use this in JavaScript, and illustrate many key points about it. CSP is enabled by [js-csp](https://github.com/jlongster/js-csp) which I will explain more soon. Here is a quick peek:

<div class="editor">var ch = chan();

go(function*() {
  var val;
  while((val = yield take(ch)) !== csp.CLOSED) {
    console.log(val);
  }
});

go(function*() {
  yield put(ch, 1);
  yield take(timeout(1000));
  yield put(ch, 2);
  ch.close();
});
</div>

*Note: these interactive example assume a very modern browser and have only been heavily tested in Firefox and Chrome.*

We get synchronous-style code with generators *by default*, and a sophisticated mechanism for coordinating tasks that is simple for basic async workflows but also scales to complex scenarios.

## Let's Talk About Promises

Before we dig in, we should talk about promises. Promises are cool. I am forever grateful that they have mostly moved the JavaScript community off of the terrible callback endemic. I really do like them a lot. Unlike [some other advocates of CSP](http://swannodette.github.io/2013/08/31/asynchronous-error-handling/), I think they actually have a good error handling story because JavaScript does a good job of tracking the location from wherever an `Error` object was created (even so, find the "icing on the cake" later in this article about debugging errors from channels). The way promises simulate try/catch for asynchronous code is neat.

I do have one issue with how errors are handled in promises: because it captures any error from a handler, you need to mark the end of a promise chain (with something like `done()`) or else it will suppress errors. It's all too easy during development to make a simple typo and have the error gobbled up by promises because you forgot to attach an error handler.

I know that is a critical design decision for promises so that you get try/catch for async code, but I've been bitten too often by it. I have to wonder if it's really worth the ability to apply try/catch to async to ignore *everything* like `TypeError` and `ReferenceError`, or if there's a more controlled way to handle errors.

Error handling in CSP is definitely more manual, as you will see. But I also think it makes it clearer where errors are handled and makes it easier to rationalize about them. Additionally, by default syntax/null/etc errors are simply thrown and not gobbled up. This has drawbacks too, but I'm liking it so far.

I lied. I have a second complaint about promises: generators are an after-thought. In my opinion, anything that deals with asynchronous behavior and doesn't natively embrace [generators](http://wiki.ecmascript.org/doku.php?id=harmony:generators) is broken (though understandable considering you need to [cross-compile](https://github.com/facebook/regenerator) them until they are fully implemented).

Lastly, when it comes down to it, using a channel is not that different from using a promise. Compare the following code that takes a value and returns a different one:

*Promise*

```js
promiseReturningFunction().then(function(value) {
  return value * 2;
});

// Or with generators:

spawn(function*() {
  return (yield promiseReturningFunction()) * 2;
});
```

*Channels*

```js
go(function*() {
  return (yield take(channelReturningFunction())) * 2;
});
```

The similarity is striking, especially when using generators with promises. This is a trivial example too, and when you start doing more async work the latter 2 approaches look far better than raw promises.

Channels are marginally better than promises with generators for single-value asynchronous coordination, but the best part is that you can do all sorts of more complex workflows that also relegate the need for streams and event-based systems.

## Using CSP in JavaScript

The fundamental idea of CSP is an old one: handle coordination between processes via messsage passing. The unique ideas of modern CSP are that processes can be simple light-weight cooperative threads, use channels to pass messages, and block execution when taking or putting from channels. This tends to make it very easy to express complex asynchronous flows.

[Generators](http://wiki.ecmascript.org/doku.php?id=harmony:generators) are coming to JavaScript and allow us to suspend and resume functions. This lets us program in a synchronous style, using everything from `while` loops to `try`/`catch` statements, but "halt" execution at any point. In my opinion, anything dealing with asynchronous behavior that doesn't completely embrace generators natively is busted.

CSP channels do exactly that. Using generators, the [js-csp](https://github.com/ubolonton/js-csp) project has been able to faithfully port Clojure's core.async to JavaScript. We will use all the same terms and function names as core.async. I eventually [forked](https://github.com/jlongster/js-csp) the project to add a few things:

* The `go` block which spawns a lightweight process always returns a channel that holds the final value from the process
* `sleep` was a special operation that you could yield, but if you wanted an actual channel that timed out you had to use `timeout` instead. I removed `sleep` so you always use `timeout` which makes it more consistent.
* I added a `takem` instruction which stands for "take maybe". If an Error object is passed through the channel it will throw it automatically at the place were `takem` was yielded.

This project is early in development so things may change, but it should be relatively stable. You will need to cross-compile generators to run it in all browsers; I recommend the ridiculously awesome [regenerator](https://github.com/facebook/regenerator) project.

If you don't know much about generators, [Kyle Simpson](https://twitter.com/getify) posted a great [4-part series](http://davidwalsh.name/es6-generators) about them. He even explores CSP in the last post but misses some critical points which have serious consequences like breaking composition and the ease of transforming values.

## Basic Principles

Let's study the basic principles of CSP:

* Processes are spawned with `go`, and channels are created with `chan`. Processes are completely unaware of each other but talk through channels.
* Use `take` and `put` to operate on channels within a process. `take` gets a value and blocks if one isn't available. `put` puts a value on a channel and blocks if a process isn't available to take it.

Wow, that's it! Pretty simple, right? There are more advanced usages of CSP, but even just with those 4 methods we have a powerful way to express asynchronous coordination.

Here's an example. We create 3 processes that put values on a channel and sleep for various times, and a 4th process that takes values off the channel and logs them. If you run the code below, you will see that that these processes are running as if they are separate threads! Each process has its own `while` loop that loops forever, which is an amazingly powerful way to express asynchronous interaction. The 4th process closes the channel after 10 values come through, which stops the other processes because a `put` on a closed channel returns `false`.

<div class="editor with-results">
var ch = chan();

go(function*() {
  while(yield put(ch, 1)) { yield take(timeout(250)); }
});

go(function*() {
  while(yield put(ch, 2)) { yield take(timeout(300)); }
});

go(function*() {
  while(yield put(ch, 3)) { yield take(timeout(1000)); }
});

go(function*() {
  for(var i=0; i<10; i++) {
    console.log(yield take(ch));
  }
  ch.close();
});
</div>

Run the code to see a visualization that shows you what actually happened. If you hover over the arrows you will see details of how values moved across the program. The 3 processes all put a value on the channel at the start of the program, but then slept for different times. Note that the first 3 processes were almost always sleeping, and the 4th was almost always blocking. Since the 4th process was always available to take a value, the other processes never had to block.

`timeout` returns a channel that closes after a specific amount of time. When a channel closes, all blocked takes on it are resumed with the value of `csp.CLOSED`, and all blocked puts are resumed with `false`.

Each process also ended at different times because they woke up at different times. You don't always have to explicitly close channels; do it only when you want to send that specific signal to other parts of the program. Otherwise, a channel that you don't use anymore (and any processes blocked on it) will simply be garbage collected.

Here's another example. This program creates 2 processes that both take and put from/onto the same channel. Again, they contain their own event loops that run until the channel is closed. The second process kicks off the interaction by putting a value onto the channel, and you can see how they interact in the visualization below. The 3rd process just closes the channel after 5 seconds.

<div class="editor with-results">
var ch = chan();

go(function*() {
  var v;
  while((v = yield take(ch)) !== csp.CLOSED) {
    console.log(v);
    yield take(timeout(300));
    yield put(ch, 2);
  }
});

go(function*() {
  var v;
  yield put(ch, 1);
  while((v = yield take(ch)) !== csp.CLOSED) {
    console.log(v);
    yield take(timeout(200));
    yield put(ch, 3);
  }
});

go(function*() {
  yield take(timeout(5000));
  ch.close();
});
</div>

You can see how values bounce back and forth between the processes. This kind of interaction would be extremely difficult with many other asynchronous solutions out there.

These `while` loops have to check if the channel is closed when taking a value off the channel. You can do this by checking to see if the value is the special `csp.CLOSED` value. In Clojure, they pass nil to indicate closed and can use it simply in a conditional (like `if((v = take(ch))) {}`). We don't have that luxury in JavaScript because several things evaluate to false, even `0`.

**One more example**. It's really important to understand that both `take` and `put` will block until both sides are there to actually pass the value. In the above examples it's clear that a `take` would block a process, but here's one where `put` obviously blocks until a `take` is performed.

<div class="editor with-results">
var ch = chan();

go(function*() {
  yield put(ch, 5);
  ch.close();
});

go(function*() {
  yield take(timeout(1000));
  console.log(yield take(ch));
});
</div>

The first process tried to put `5` on the channel, but nobody was there to take it, so it waited. This simple behavior turns out to be extremely powerful and adaptable to all sorts of complex asynchronous flows, from simple rendezvous to complex flows with timeouts.

## Channels as Promises

We've got a *lot* more cool stuff to look at, but let's get this out of the way. How do processes map to promises, exactly? Honestly, this isn't really that interesting of a use case for channels, but it's necessary because we do this kind of thing all the time in JavaScript.

Treating a channel as a promise is as simple as spawning a process and putting a single value onto it. That means that every single async operation is its own process that will "fulfill" a value by putting it onto its channel. The key is that these are lightweight processes, and you are able to create hundreds upon thousands of them. I am still tuning the performance of js-csp, but creating many channels should be perfectly fine.

Here's an example that shows how many of the promise behaviors map to channels. `httpRequest` gives us a channel interface for doing AJAX, wrapping a callback just like a promise would. `jsonRequest` transforms the value from `httpRequest` into a JSON object, and errors are handled throughout all of this.

<div class="editor">
function httpRequest(url) {
  var ch = chan();
  var req = new XMLHttpRequest();
  req.onload = function() {
    if(req.status === 200) {
      csp.putAsync(ch, this.responseText);
    }
    else {
      csp.putAsync(ch, new Error(this.responseText));
    }
  }
  req.open('get', url, true);
  req.send();
  return ch;
}

function jsonRequest(url) {
  return go(function*() {
    var value = yield take(httpRequest(url));
    if(!(value instanceof Error)) {
      value = JSON.parse(value);
    }
    return value;
  });
}

go(function*() {
  var data = yield takem(jsonRequest('sample.json'));
  console.log(JSON.stringify(data));
});
</div>

You can see how this is very similar to code that uses promises with generators. The `go` function by default returns a channel that will have the value returned from the generator, so it's easy to create one-shot promise-like processes like `jsonRequest`. This also introduces `putAsync` (there's also `takeAsync`). These functions allow you to put values on channels outside of a `go` block, and can take callbacks which run when completed.

One of the most interesting aspects here is error handling. It's very different from promises, and more explicit. But in a good way, not like the awkward juggling of callbacks. Errors are simply sent through channels like everything else. Transformative functions like `jsonRequest` need to only operate on the value if it's not an error. In my code, I've noticed that really only a few channels send errors, and most of them (usually higher-level ones) don't need to worry because errors are handled at the lower-level. The benefit over promises is that when I know I don't need to worry about errors, I don't have to worry about ending the promise chain or anything. That overhead simply doesn't exist.

You probably noticed I said `yield takem(jsonRequest('sample.json'))` instead of using `take`. `takem` is another operation like `take`, except that when an `Error` comes off the channel, it is thrown. Try changing the url and checking your devtools console. Generators allow you to throw errors from wherever they are paused, so the process will be aborted if it doesn't handle the error. How does it handle the error? With the native `try`/`catch` of course! This is so cool because it's a very terse way to handle errors and lets us use the synchronous form we are used to. There's icing on the cake, too: in your debugger, you can set "pause on exceptions" and it should pause *where it was thrown*, giving you additional context and letting you inspect the local variables in your process (while the stack of the `Error` will tell you where the error actually happened). This doesnt work from the above editors because of `eval` and web worker complications.

Another option for error handling is to create separate channels where errors are sent. This is appropriate in certain (more complicated) scenarios. It's up to you.

## Taming User Interfaces

We've seen a few abstract programs using channels and also how we can do typical asynchronous coordination with them. Now let's look at something much more interesting: completely reinventing how we interact with user interfaces.

The Clojure community has blown this door wide open, and I'm going to steal one of David Nolen's examples from [his post](http://swannodette.github.io/2013/07/12/communicating-sequential-processes/) to start with. (you'll also want to check out [his other post](http://swannodette.github.io/2013/07/31/extracting-processes/)). Here we make a simple `listen` function which gives us a channel interface for listening to DOM events, and we start a process which handles a mouseover event and prints the coordinates.

<div class="editor needs-dom">
function listen(el, type) {
  var ch = chan();
  el.addEventListener(type, function(e) {
    csp.putAsync(ch, e);
  });
  return ch;
}

go(function*() {
  var el = document.querySelector('#ui1');
  var ch = listen(el, 'mousemove');
  while(true) {
    var e = yield take(ch);
    el.innerHTML = ((e.layerX || e.clientX) + ', ' +
                    (e.layerY || e.clientY));
  }
});
</div>

<div class="html-output" id="ui1"></div>


Go ahead, move the mouse over the area above and you'll see it respond. We essentially have create a *local event loop* for our own purposes. You'll see with more complex examples that this is an extraordinary way to deal with user interfaces, bringing simplicity to complex workflows.

Let's also track where the user clicks the element. Here's where channels begin to shine, if they didn't already. Our local event loop handles *both* the `mousemove` and `click` events, and everything is nicely scoped into a single function. There's no callbacks or event handlers anywhere. If you've ever tried to keep track of state across event handlers this should look like heaven.

<div class="editor needs-dom">function listen(el, type) {
  var ch = chan();
  el.addEventListener(type, function(e) {
    csp.putAsync(ch, e);
  });
  return ch;
}

go(function*() {
  var el = document.querySelector('#ui2');
  var mousech = listen(el, 'mousemove');
  var clickch = listen(el, 'click');
  var mousePos = [0, 0];
  var clickPos = [0, 0];
  
  while(true) {
    var v = yield alts([mousech, clickch]);
    var e = v.value;
    if(v.channel === mousech) {
      mousePos = [e.layerX || e.clientX, e.layerY || e.clientY];
    }
    else {
      clickPos = [e.layerX || e.clientX, e.layerY || e.clientY];
    }
    el.innerHTML = (mousePos[0] + ', ' + mousePos[1] + ' &mdash; ' +
                    clickPos[0] + ', ' + clickPos[1]);
  }
});</div>
<div class="html-output" id="ui2"></div>

Mouse over the above area, and click on it. This is possible because of a new operation `alts`, which takes multiple channels and blocks until one of them sends a value. The return value is an object of the form `{ value, channel }`, where `value` is the value returned and `channel` is the channel that completed the operation. We can compare which channel sent the value and conditionally respond to the specific event.

`alts` actually isn't constrained to performing a `take` on each channel. It actually blocks until any *operation* is completed on each channel, and by default it performs `take`. But you can tell it to perform `put` by specifying an array with a channel and a value instead of just a channel; for example, `alts([ch1, ch2, [ch3, 5]])` performs a `put` on `ch3` with the value `5` and a `take` on `ch1` and `ch2`.

Expressing UI interactions with `alts` maps extremely well to how we intuitively think about them. It allows us to wrap events together into a single event, and respond accordingly. No callbacks, no event handlers, no tracking state across functions. We think about UI interactions like this all the time, why not express your code the same way?

<a id="tooltip"></a>

If you've ever developed UI controls, you know how complex they quickly get. You need to delay actions by a certain amount, but cancel that action altogether if something else happens, and coordinate all sorts of behaviors. Let's look at a slightly more complex example: a tooltip.

Our tooltip appears if you hover over an item for 500ms. The complete interaction of waiting that amount, but cancelling if you mouse out, and adding/removing the DOM nodes is implemented below. This is the complete code; it relies on nothing other than the CSP library.

<div class="editor needs-dom">function listen(el, type, ch) {
  ch = ch || chan();
  el.addEventListener(type, function(e) {
    csp.putAsync(ch, e);
  });
  return ch;
}

function listenQuery(parent, query, type) {
  var ch = chan();
  var els = Array.prototype.slice.call(parent.querySelectorAll(query));
  els.forEach(function(el) {
    listen(el, type, ch);
  });
  return ch;
}

function tooltip(el, content, cancel) {
  return go(function*() {
    var r = yield alts([cancel, timeout(500)]);

    if(r.channel !== cancel) {
      var tip = document.createElement('div');
      tip.innerHTML = content;
      tip.className = 'tip-up';
      tip.style.left = el.offsetLeft - 110 + 'px';
      tip.style.top = el.offsetTop + 75 + 'px';
      el.parentNode.appendChild(tip);

      yield take(cancel);
      el.parentNode.removeChild(tip);
    }
  });
}

function menu(hoverch, outch) {
  go(function*() {
    while(true) {
      var e = yield take(hoverch);
      tooltip(e.target,
              'a tip for ' + e.target.innerHTML,
              outch);
    }
  });
}

var el = document.querySelector('#ui3');
el.innerHTML = '&lt;span&gt;one&lt;/span&gt; &lt;span&gt;two&lt;/span&gt; &lt;span&gt;three&lt;/span&gt;';

menu(listenQuery(el, 'span', 'mouseover'),
     listenQuery(el, 'span', 'mouseout'));</div>
<div class="html-output" id="ui3"></div>

Hover over the words above for a little bit and a tooltip should appear. Most of our code is either DOM management or a few utility functions for translating DOM events into channels. We made a new utility function `listenQuery` that attaches event listeners to a set of DOM elements and streams all those events through a single channel.

We already get a hint of how well you can abstract UI code with channels. There are essentially two components: the menu and the tooltip. The menu is a process with its local event loop that waits for something to come from `hoverch` and creates a tooltip for the target.

The tooltip is its own process that waits 500ms to appear, and if nothing came from the `cancel` channel it adds the DOM node, waits for a signal from `cancel` and removes itself. It's extraordinarily straightforward to code all kinds of interactions.

Note that I never said "wait for a hover event", but rather "wait for a signal from `hoverch`". We actually have no idea what is on the other end of `hoverch` actually sending the signals. In our code, it is a real `mouseover` event, but it could be anything else. We've achieved a fantastic separation of concerns. David Nolen talks more about this in [his post](http://swannodette.github.io/2013/07/31/extracting-processes/).

These have been somewhat simple examples to keep the code short, but if you are intruiged by this you should also check out David's [walkthrough](http://swannodette.github.io/2013/08/17/comparative/) where he creates a real autocompleter. All of these ideas come even more to life when things get more complex.

## Buffering

There's another features of channels which is necessary when doing certain kinds of work: buffering. Channels can be buffered, which frees up both sides to process things at their own pace and not worry about someone blocking the whole thing.

When a channel is buffered, a `put` will happen immediately if room is available in the buffer, and a `take` will return if there's something in the buffer and otherwise block until there's something available.

Take a look below. You can buffer a channel but passing an integer to the constructor, which is the buffer size. We create a channel is a buffer size of 13, a process that puts 15 values on the channel, and another process that takes 5 values off every 200ms. Run the code and you'll see how buffering makes a difference.

<div class="editor">var start = Date.now();
var ch = chan(13);

go(function*() {
  for(var x=0; x<15; x++) {
    yield put(ch, x);
    console.log('put ' + x);
  }
});

go(function*() {
  while(!ch.closed) {
    yield take(timeout(200));
    for(var i=0; i<5; i++) {
      console.log(yield take(ch));
    }
  }
});

go(function*() {
  yield take(timeout(1000));
  ch.close();
});</div>

The first 13 puts happen immediately, but then it's blocked because the buffer is full. When a `take` happens, it's able to put another value in the buffer, and so on. Try removing `13` from the `chan` constructor and seeing the difference.

There are 3 types of buffers: fixed, dropping, and sliding. When an operation is performed on a fixed buffer, if it is full it will always block like normal. However, dropping and sliding buffers will *never* block. If the buffer is full when a `put` is performed, a dropping buffer will simply drop the value and it's lost forever, and a sliding buffer will remove the oldest value to make room for the new value.

Try it out above. Change `chan(13)` to `chan(csp.buffers.dropping(5))` and you'll see that all the puts happen immediately, but only the first 5 values are taken and logged. The last 10 puts just dropped the values. You may see 5 `null`s printed as well because there the second process ran one last time but nothing was in the buffer.

Try it with `chan(csp.buffers.sliding(5))` and you'll see that you get the last 5 values instead.

You can implement all sorts of performance strategies using this, like [backpressure](http://en.wikipedia.org/wiki/Back_pressure). If you were handling server requests, you would have a dropping buffer of a fixed size that started dropping requests at a certain point. Or if you were doing some heavy processing from a frequent DOM event, you could use a sliding buffer to only process the latest values as fast as possible.

## Transducers &mdash; Transformation of Values

Channels are a form of streams, and as with anything stream-like, you will want to frequently transform the data as it comes through. Our examples were simple enough to avoid this, but you will want to use `map` on channels just as frequently as you use `map` on arrays.

[js-csp](https://github.com/jlongster/js-csp) comes with a bunch of [builtin transformations](https://github.com/jlongster/js-csp/blob/master/doc/advanced.md) which provide a powerful set of tools for managing channels. However, you'll notice that a lot of them are duplications of ordinary transformers for arrays (map, filter, etc).

Within the past month Clojure has actually solved this with something called [transducers](http://blog.cognitect.com/blog/2014/8/6/transducers-are-coming). Even better, while I was writing this post, [another post](http://phuu.net/2014/08/31/csp-and-transducers.html) about CSP and transducers in JS came out. His channel implementation is extremely primitive, but he mostly focuses on tranducers and it's a great walkthrough of how we can apply them to channels.

I ran out of time to fully research transducers and show off good examples here. Most likely I will posting more about js-csp, so expect to see more about that soon.

## The Beginning of Something New

Fron now on I will always be using [js-csp](https://github.com/jlongster/js-csp) in my projects. I sincerely believe that this is a better way to express asynchronous communication and has wide impact on everything from server management to user interfaces. I hope that the JS community learns from it, and I will be posting more articles as I wrote more code with it.

I also ran out of time to explore using [sweet.js](http://sweetjs.org/) macros to implement native syntax for this. Imagine if you could just use `var v = <-ch` to take from a channel, or something like it? I'm definitely going to do this soon, so expect another post. Oh the power!

[js-csp](https://github.com/jlongster/js-csp) itself is somewhat new so I wouldn't go and write a production app quite yet, but it will get there soon. I give my gratitude to ubolonton for the fantastic [initial implementation](https://github.com/ubolonton/js-csp). It's up to you whether to use my fork or his project, but we will hopefully merge them soon.





<style type="text/css">.post article > p:first-of-type { font-size: 1em; }</style>

<script src="http://jlongster.com/s/jlongster.com-util/underscore-min.js"></script>
<script src="http://jlongster.com/s/csp-post/js/bundle.js"></script>
