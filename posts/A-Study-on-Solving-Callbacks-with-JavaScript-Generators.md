---
tags: ["js"]
published: true
date: "June 5, 2013"
readnext: "A-Closer-Look-at-Generators-Without-Promises"
abstract: "Callback hell is a real problem in node.js. Since generators have landed in V8, I take a look at how we can write code with them, leveraging promises to handle the details. This technique vastly improves code with asynchronous workflows. "
shorturl: "A-Study-on-Solving-Callbacks-with-JavaScript-Generators"
headerimg: "http://jlongster.com/s/post-headerimgs/postbg-callback.png"
---

# A Study on Solving Callbacks with JavaScript Generators

When I first started writing node.js code, there were 2 things I hated: all the popular templating engines, and the proliferation of callbacks. I was willing to put up with callbacks because I understood the power of event-based servers, but since I saw that [generators](http://wiki.ecmascript.org/doku.php?id=harmony:generators) were coming to JavaScript, I have eagerly awaited the day they were implemented.

That day has come. Today, they have landed [landed in V8](http://wingolog.org/archives/2013/05/08/generators-in-v8) and SpiderMonkey's implementation is being updated to the spec. A new era is born!

Although V8 hides harmony features like generators behind a command line flag, and it will be a while before they are available in all browsers (even though Firefox has had them forever), we can go ahead and study how to write async code with generators. We should establish these patterns early on.

You can use them today by downloading [the unstable version 0.11 of node](http://nodejs.org/dist/v0.11.2/) which is the *next* version to be released (it may already be released when you read this). You need to pass the `--harmony` or `--harmony-generators` flag to node, but this flag will go away whenever the ES6 spec is finalized, I believe.

So how do generators help node's callback hell? Generator functions can suspend execution with the `yield` keyword, and pass values back and forth when resuming and suspending. This means that we can "pause" a function when it needs to wait on the result of a function, instead of passing a callback to it.

Isn't it fun trying to explain a language construct in English? How about we just dive in.

***Update***: Be sure to read my follow-up post, [A Closer Look at Generators Without Promises](http://jlongster.com/A-Closer-Look-at-Generators-Without-Promises)!

## Generator Basics

Let's look at a raw generator function before we dive into async land. Generators are defined with `function*`:

```js
function* foo(x) {
    yield x + 1;

    var y = yield null;
    return x + y;
}
```

I'm not going to dive into this too much because I want to focus on how to use this with async constructs. Here's how to use the generator though:

```js
var gen = foo(5);
gen.next(); // { value: 6, done: false }
gen.next(); // { value: null, done: false }
gen.send(8); // { value: 13, done: true }
```

If I was taking notes in class, I'd write these down:

* `yield` is allowed anywhere an expression is. This makes it a powerful construct for pausing a function in the middle of anything, such as `foo(yield x, yield y)`, or loops.
* Calling a generator looks like a function, but it just creates a generator object. You need to call `next` or `send` to resume the generator. `send` is used when you want to send values back into it. `gen.next()` is equivalent to `gen.send(null)`. There's also `gen.throw` which throws an exception from within the generator.
* Generator methods don't return a raw value, they return an object with two properties: `value` and `done`. This makes it clear when a generator is finished, either with `return` or simply the end of the function, instead of a clunky `StopIteration` exception was the old API.

## Async Solution #1: Suspend

What does the above code have to do with node's callback hell? Well, if we are able to arbitrarily pause execution of a function, we can turn our asynchronous callback code back into synchronous-looking code with a tiny bit of sugar.

The question is: what is that sugar?

The first solution proposed is the [suspend library](https://github.com/jmar777/suspend). This is about as simple as we can get. Seriously, it's only [16 lines of code](https://github.com/jmar777/suspend/blob/master/lib/suspend.js).

With this library, here's how async code looks:

```js
var suspend = require('suspend'),
    fs = require('fs');

suspend(function*(resume) {
    var data = yield fs.readFile(__filename, 'utf8', resume);
    if(data[0]) {
        throw data[0];
    }
    console.log(data[1]);
})();
```

The `suspend` function turns your generator into a normal function that runs the generator. It passes a `resume` function to the generator which should be used as the callback for all async functions, and it will resume the generator with a 2-element array containing the error and value.

The dance between `resume` and the generator is interesting, but it has some drawbacks. First, getting back a 2-element array is annoying, even with destructuring (`var [err, res] = yield foo(resume)`). I would rather it only return the value, and throw the error as an exception if it exists. It looks like the library actually [supports that](https://github.com/jmar777/suspend#throw-behavior) as an option, but I think it should be the default.

Secondly, it's slightly awkward to always have to explicity pass resume, and it's not very composable because if I wanted to wait until the above function is done, I still have to add a `callback` parameter and call it at the end of the function like you normally do it in node. This causes more havoc with error handling, since the error needs to be passed forward instead of thrown, so you need to manually check and forward the error after *every* async call in the function.

Lastly, you can't do more complex control flow like doing multiple things in parallel. The [README claims](https://github.com/jmar777/suspend#what-about-parallel-execution-mapping-etc) that other control flow libraries already solve this, and you should use `suspend` along with one of those, but I'd rather see the control flow libraries incorporate generator support natively.

***Update:*** [kriskowal](https://twitter.com/kriskowal) has mentioned [this gist](https://gist.github.com/creationix/5544019) written by [creationix](https://twitter.com/creationix), which implements a better stand-alone generator handler for callback-based code. It's very cool, throws error by default, and is cleaner.

## Async Solution #2: Promises

A better way to handle asynchronous flow is using [promises](http://promises-aplus.github.io/promises-spec/). A promise is an object that represents a future value, and you can compose promises to represent the control flow of a program involving asynchronous behavior.

I'm not going explain promises here, as it would take too long and there's already [a good explanation](http://domenic.me/2012/10/14/youre-missing-the-point-of-promises/). Recently a lot of emphasis has been put on defining the behavior and API of promises to allow interop between libraries, but the idea is pretty simple.

I'm going to use the [Q](https://github.com/kriskowal/q) promise library because it already has prelimary support for generators and is also very mature. [task.js](http://taskjs.org) was an early implementation of this idea, but it has a non-standard promise implementation.

Let's take a step back and look at an honest real-world example. It's too often that we use stupidly simple examples. This code creates a post, then gets it back, and gets posts with the same tags (`client` is a redis instance):

```js
client.hmset('blog::post', {
    date: '20130605',
    title: 'g3n3rat0rs r0ck',
    tags: 'js,node'
}, function(err, res) {
    if(err) throw err;

    client.hgetall('blog::post', function(err, post) {
        if(err) throw err;

        var tags = post.tags.split(',');
        var posts = [];

        tags.forEach(function(tag) {
            client.hgetall('post::tag::' + tag, function(err, taggedPost) {
                if(err) throw err;
                posts.push(taggedPost);

                if(posts.length == tags.length) {
                    // do something with post and taggedPosts

                    client.quit();
                }
            });
        });
        
    });
});
```

This isn't even *that* complex of an example, and look how ugly it already is. The callbacks quickly squeeze the code into the right side of the screen. Additionally, to query all the tags we need to manually manage each query and check when all of them are ready.

Let's transform that into [Q](https://github.com/kriskowal/q) promises.

```js
var db = {
    get: Q.nbind(client.get, client),
    set: Q.nbind(client.set, client),
    hmset: Q.nbind(client.hmset, client),
    hgetall: Q.nbind(client.hgetall, client)
};

db.hmset('blog::post', {
    date: '20130605',
    title: 'g3n3rat0rs r0ck',
    tags: 'js,node'
}).then(function() {
    return db.hgetall('blog::post');
}).then(function(post) {
    var tags = post.tags.split(',');

    return Q.all(tags.map(function(tag) {
        return db.hgetall('blog::tag::' + tag);
    })).then(function(taggedPosts) {
        // do something with post and taggedPosts

        client.quit();
    });
}).done();
```

We had to wrap the callback-based redis functions into promise-based ones, but that's simple. Once we have promises, you call `then` to wait on the result of an async operation. A much more detailed explanation is in the [promises/A+ spec](http://promises-aplus.github.io/promises-spec/).

`Q` implements a few additional methods such as `all`, which takes an array of promises and waits for all of them to finish. There is also `done`, which says that your async workflow is finished and any unhandled errors should be thrown. According to the promises/A+ spec, all exceptions are converted into errors and passed to the error handler, so you need to make sure they are re-thrown if not handled. (If this is confusing to you, please read [this blog post](http://domenic.me/2012/10/14/youre-missing-the-point-of-promises/) by Domenic.)

Note how we had to nest the final promise handler because we needed to access `post` as well as `taggedPosts`. This feels similar to the callback style code, which is unfortunate.

Now, it's time to explore the power of generators:

<a id="q-example"></a>

```js
Q.async(function*() {
    yield db.hmset('blog::post', {
        date: '20130605',
        title: 'g3n3rat0rs r0ck',
        tags: 'js,node'
    });

    var post = yield db.hgetall('blog::post');
    var tags = post.tags.split(',');

    var taggedPosts = yield Q.all(tags.map(function(tag) {
        return db.hgetall('blog::tag::' + tag);
    }));

    // do something with post and taggedPosts

    client.quit();
})().done();
```

Isn't that amazing? So what's actually happening here?

`Q.async` takes a generator and returns a function that runs it, much like the suspend library. However, there's a key difference, which is that the generator yields promises. Q takes each promise and ties the generator to it, making it resume when the promise is fulfilled, and sending back the result.

We don't have to handle a clunky `resume` function, promises are implicitly handled, and we benefit from all of the behaviors of [promises](http://promises-aplus.github.io/promises-spec/).

One of the benefits is that we can use Q promises when needed, such as `Q.all`, which runs several async operations in parallel. In this way, it's easy to combine explicit Q promises and implicit promises in generators to create complex flows that look very clean.

Also note that we don't have the nesting problem at all. Since `post` and `taggedPosts` stay in the same scope, we don't have to care anymore about the `then` chain breaking scope, which is incredibly awesome.

Error handling is a little tricky, and you really should understand how promises work before using them in generators. Errors and exceptions in promises are *always* passed to the error handler function, and never thrown. An `async` generator is a promise, and is no exception. You could handle errors with an error callback: `someGenerator().then(null, function(err) { ... })`.

*However*, there is a special behavior of generator promises which is that any errors from promises within it *will* be thrown from the generator using the special `gen.throw` method, which throws an exception from the point that the generator is suspended. This means that you can use `try`/`catch` to handle the error within the generator:

```js
Q.async(function*() {
    try {
        var post = yield db.hgetall('blog::post');
        var tags = post.tags.split(',');

        var taggedPosts = yield Q.all(tags.map(function(tag) {
            return db.hgetall('blog::tag::' + tag);
        }));

        // do something with post and taggedPosts
    }
    catch(e) {
        console.log(e);
    }
    
    client.quit();
})();
```

This works the way you'd expect; errors from any of the `db.hgetall` functions will be handled in the `catch` handler, even though the error could come from a nested promise within `Q.all`. Of course, without a `try`/`catch` the exception would be converted back into an error and passed to the error handler of the calling promise (there isn't one above, so the error would be quietly suppressed).

Let that sink in for a second. **We are able to install exception handlers with try/catch for async code**. And the dynamic scope of the error handler works correctly; *any* unhandled errors that happen while the `try` block executes will be given to `catch`. You can even use `finally` to make sure "cleanup" code is run, even on error, without having to handle the error.

In addition, as long as you also call `done` whenever you use promises, you also will by default get errors thrown instead of quietly ignored, which happens all too often with async code. The way `Q.async` is used will usually look like this:

```js
var getTaggedPosts = Q.async(function*() {
    var post = yield db.hgetall('blog::post');
    var tags = post.tags.split(',');

    return Q.all(tags.map(function(tag) {
        return db.hget('blog::tag::' + tag);
    }));
});
```

The above is library code, and simply creates promises and doesn't concern itself with error handling. You call it like this:

```js
Q.async(function*() {
    var tagged = yield getTaggedPosts();
    // do something with the tagged array
})().done();
```

This is top-level code. As said before, the `done` method makes sure to throw any unhandled errors as exceptions. I believe the above pattern is *so* common, however, that a new method is called for. The `getTaggedPosts` is a library function, to be consumed as a promise-generating function. The above code is just top-level code that consumes promises.

I proposed `Q.spawn` in [this pull request](https://github.com/kriskowal/q/pull/306), and it has been merged into Q already! This makes it even simpler to simply run code that consumes promises:

```js
Q.spawn(function*() {
    var tagged = yield getTaggedPosts();
    // do something with the tagged array
});
```

`spawn` takes a generator and runs it immediately, and automatically rethrows any unhandled errors. It's exactly equivalent to `Q.done(Q.async(function*() { ... })())`.

## Other Patterns

Our promised-based generator code is starting to take shape. With a little sugar, we can remove a lot of baggage usually incurred by async workflows.

After working with generators for a while, here are few patterns I've noticed.

### Not Worth It

If you have a short function that only needs to wait on one promise, it is not worth it to create a generator. Compare this code:

```js
var getKey = Q.async(function*(key) {
    var x = yield r.get(dbkey(key));
    return x && parseInt(x, 10);
});
```

With this code:

```js
function getKey(key) {
    return r.get(dbkey(key)).then(function(x) {
        return x && parseInt(x, 10);
    });
}
```

I think the latter version looks cleaner.

### spawnMap

This is something I found myself doing a lot:

```js
yield Q.all(keys.map(Q.async(function*(dateKey) {
    var date  = yield lookupDate(dateKey);
    obj[date] = yield getPosts(date);
})));
```

It might be helpful to have `spawnMap`, which performs `Q.all(arr.map(Q.async(...)))` for you.

```js
yield spawnMap(keys, function*(dateKey) {
    var date  = yield lookupDate(dateKey);
    obj[date] = yield getPosts(date);
})));
```

This is similar to the `map` method in the [async](https://github.com/caolan/async#quick-examples) library.

### asyncCallback

The last thing I noticed is that there are times when I want to create a `Q.async` function, but I want to enforce all errors to be rethrown. This happens with normal callbacks from various libraries, such as express: `app.get('/url', function() { ... })`.

I can't convert the above callback into a `Q.async` function because then all errors would be quietly suppressed, but I can't use `Q.spawn` because it shouldn't be executed immediately. Perhaps something like `asyncCallback` is in order:

```js
function asyncCallback(gen) {
    return function() {
        return Q.async(gen).apply(null, arguments).done();
    };
}

app.get('/project/:name', asyncCallback(function*(req, res) {
    var counts = yield db.getCounts(req.params.name);
    var post = yield db.recentPost();

    res.render('project.html', { counts: counts,
                                 post: post });
}));

```


## Final Thoughts

When I discovered generators, I was very hopeful that they would help with async code. It turns out that they do, although you really do have to understand how promises work to combine them with generators effectively. Making promises implicit makes them a little more mystical, so I wouldn't use `async` or `spawn` until you understand promises in general.

Even though I wish JavaScript magically had continuations so all of this was handled implicitly by the language, this solution is pretty good. We now have a concise way of coding asynchronous behavior, which is incredibly powerful because we can use this for more than just making filesystem operations prettier. We essentially have a way to write terse *distributed* code that can operate across processes, or even machines, while looking synchronous.
