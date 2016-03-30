---
shorturl: "Stop-Trying-to-Catch-Me"
tags: ["promise"]
published: true
date: "April 7, 2015"
abstract: "I'm probably going to regret this, but this post is about promises. There are a few details that I'd like to spell out so I can point people to this post instead of repeating myself. Here are a few reasons why I don't like promises."
---

# Stop Trying to Catch Me

I'm probably going to regret this, but this post is about promises. There are a few details that I'd like to spell out so I can point people to this post instead of repeating myself. This is not a hyperbolic post like [Radical Statements about the Mobile Web](http://jlongster.com/Radical-Statements-about-the-Mobile-Web), which I sort of regret posting. In that post I was just yelling from a mountaintop, which isn't very helpful.

I humbly submit these points as reasons why I don't like promises, with full realization that the ship has sailed and nothing is going to change.

First, let's talk about `try`/`catch`. The problem with exception handling in JavaScript is that it's too aggresive. Consider the following code:

```js
try {
  var result = foo(getValue());
}
catch(e) {
  // handle error from `foo`  
}
```

We've accidentally captured the `getValue()` expression within this handler, so any error within `getValue` is captured. This is how exceptions work, of course, but it's made worse in JavaScript because a *simple typo* becomes an exception.

Exceptions are meant to be just that, exceptional. In most other languages, many typo-style errors are caught at compile-time, even in dynamic languages like Clojure. But in JavaScript, with the above code, if I was happily hacking away within `getValue` and I typed `fucn()` instead of `func()`, it gets caught and treated as an exception here.

I don't like how easy it is to get tripped up `try`/`catch`. We could turn the above code into this:

```js
try {
  var result = foo(getValue());
}
catch(e) {
  if(e instanceof FooError) {
    // handle error from `foo`
    return;
  }
  throw e;
}
```

Not only is this a ton of boilerplate, but it breaks an important feature of JavaScript debuggers: break on exception. If you have break on exception enabled, and you make an error inside `getValue`, it now pauses on the `throw` in the above code instead of inside `getValue` where you actually made the mistake.

So it's crazy to me that promises want to apply this behavior to async code and wrap *everything* in a `try`/`catch`. Break on exception is permanently broken now, and we have to go through all sorts of contortions and backflips to get back to reasonable debugging environment. All because it wraps code in `try`/`catch` by default.

I don't care about awkward `.then()` syntax. I don't mind automatic error propagation. I don't care having to call `.done()` on a promise chain. I don't care about losing the stack (which is inherent in any async work).

I care that promises grab *all* errors, just like `try`/`catch`. The cost of a simple typo is greatly magnified. When you do async work in most other systems, you deal with errors *pertaining to your async call*. If I make an HTTP request, I want the network error to automatically bubble up the promise chain. I don't want anything unrelated to the async work to bubble up. I don't care about it.

I should be able to reject a promise with an error, and it bubbles up. But I want to make stupid typo errors and have them appear as normal errors, not caught by promises. Don't run everything in `try`/`catch`.

### Oh, and about `async`/`await`

ES7 proposes async functions for doing async work. A lot of people are extremely excited about it, and honestly I don't get the excitement. Async functions are only pretty generators with promises:

```js
var asyncFunction = Task(function*() {
  var result = yield fetch(url);
  return process(result);
}):
```

`fetch` returns a promise. With async functions, it would look like this:

```js
async function asyncFunction() {
  var result = await fetch(url);
  return process(result);
}
```

Ok, so that is nicer, and `asyncFunction` is hoisted (I think) like a normal function would be. It's cool, I just don't understand why everyone is *so* excited about a simple syntactic improvement.

Especially when we still have all the problems with promises. For example, some top-level promise code now looks like:

```js
async function run() {
  console.log(await asyncFunction());
}

run();
```

A newbie to JavaScript will write that code, and be totally bewildered when nothing happens. They have no idea that they made a typo in `asyncFunction`, and it takes them a while to learn that `run` actually returns a promise.

Here a few ideas I have:

1. Allow `run` to mark itself as a top-level function somehow that automatically throws errors
2. Now that we have #1, when an error happens inside a promise, the JS engine check the promise chain to see if the error should immediately throw or not. It should immediately throw (as a *normal error*) if there is a top-level async function at the beginning of the promise chain.

Ok, so that's really just one idea. Native `async`/`await` syntax could potentitally help here, if we are willing to think outside of promises.

### You're Writing An Angry Tweet Right Now, Aren't You?

We are discussing error handling within the [js-csp](https://github.com/ubolonton/js-csp) project, which implements go-style channels. Most likely we are going to propogate errors, but only ones that comes down channels. I've been trying this out for a while and I love it.

I'm not going to spend time here convincing you to use js-csp, I just wanted to offer a solution instead of just complaining.

Hopefully I explained this well. I don't expect anything to change. I think my idea about async/await is pretty cool, so I hope someone looks into it.
