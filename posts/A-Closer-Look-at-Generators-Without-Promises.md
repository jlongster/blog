---
tags: ["js","generators"]
published: true
date: "June 7, 2013"
readnext: "A-Study-on-Solving-Callbacks-with-JavaScript-Generators"
abstract: "In my last post, I studied how combining promises and generators provides a nice solution for callback hell. Here I look at a few solutions for simply using generators, without promises at all, in node to write nice async code."
shorturl: "A-Closer-Look-at-Generators-Without-Promises"
headerimg: "http://jlongster.com/s/post-headerimgs/postbg-callback2.png"
---

# A Closer Look at Generators Without Promises

After posting [my article](http://jlongster.com/A-Study-on-Solving-Callbacks-with-JavaScript-Generators) about combining JavaScript generators with promises, I got a lot of feedback. My solution focused on various ways of combining [Q promises](https://github.com/kriskowal/q) with JavaScript generators to write async code in a synchronous style.

It turns out there's been a lot of successful experimentation with combining raw callback-based async code with generators, ignoring promises completely.

Why is it even worth pursuing? One of the biggest concerns I hear about is performance of promises, which honestly is really strange to me because we're using this inherently to work with I/O-bottlenecked apps, most likely *across machines*. I can't imagine that it's easy for promises to become the bottleneck. However, apparently some people have had problems with it (when you scale big enough), so it is true that promises have a performance and memory hit.

Another, possibly more salient, reason is that the cognitive space of promises is quite large. It has the feeling of "buying in" to a completely different paradigm, and hardly any node modules use them. Additionally, if we look at all of the non-promise but generator-based async libraries, they are *tiny* and it's so incredibly clear what's going on and how they interact with the normal callback-based functions. 

I decided to write another post and give the non-promise but generator-based libraries another shot. This won't be as in-depth as [my previous article](http://jlongster.com/A-Study-on-Solving-Callbacks-with-JavaScript-Generators), but let's see what other experimentation is going on in the node world.

As a sidenote, the node landscape changes *so* fast and the code in this article will get out-of-date quickly.

## The Plan

I'm going to focus on code. I'm going to introduce each library, show the same example written with every library, and then make a few notes.

There are actually two examples in all of the code blocks. The first shows what it looks like to write top-level code with the library, and the next show what library-level code looks like. These reflect different aspects of each library. The code assumes that `client` is a redis db instance. It saves a post object to the db, fetches it back, and gets all the posts with the same tags as the original post.

None of these libraries use promises. Instead, most of them run a generator and expect it to yield a function that takes a single parameter: a callback. The harness code creates a callback (that resumes the generator), and calls the yielded function with it, which ends up giving the callback to whatever native API you're working with.

I recommend checking out the sources of the below libraries. You can implement the above technique in ~20 lines of javascript, so it's trivial. The differences are how you handle errors and what it looks like to construct and use these async generators.

## Suspend

I briefly looked at [suspend](https://github.com/jmar777/suspend) in my [last article](http://jlongster.com/A-Study-on-Solving-Callbacks-with-JavaScript-Generators).

jmar777 responded in the comments with reasons why he chose the API of `suspend`. Fundamentally, there are two things to consider: how errors are handled, and how to interface with callbacks. He chose to return every error instead of throwing it, and manually handle the `resume` function to functions requiring a callback. The benefit is that you can work directly with callback-based async functions.

```js
// as top-level code

suspend(function*(resume) {
    yield client.hmset('blog::post', {
        date: '20130605',
        title: 'g3n3rat0rs r0ck',
        tags: 'js,node'
    }, resume);

    var post = yield client.hgetall('blog::post', resume);
    if(post[0]) throw post[0];
    post = post[1];

    var tags = post.tags.split(',');
    var taggedPosts = yield async.map(tags, function(tag, cb) {
        client.hgetall('blog::post::' + tag, cb);
    }, resume);

    if(taggedPosts[0]) throw taggedPosts[0];
    taggedPosts = taggedPosts[1];

    client.quit();
})();

// as library code

var getPost = suspend(function*(resume, callback) {
    var post = yield client.hgetall('blog::post', resume);
    if(post[0]) return callback(post[0]);

    var meta = yield client.hgetall('blog::post::meta', resume);
    if(meta[0]) return callback(meta[0]);

    callback(null, { post: post[1], meta: meta[1] });
});

// getPost(function(err, obj) { ... })
```

Notes:

* Since you manually hand the `resume` function to libraries, you don't have to wrap anything.
* Every error must be manually checked and handled.
* Creating a library function is exactly the same as normal callback style.
* You must use a library like [async](https://github.com/caolan/async) if you want more complex operations, like waiting on a list of async values.

## Genrun

[This gist](https://gist.github.com/creationix/5544019) was brought to light, created by [creationix](https://twitter.com/creationix), and it doesn't have a name so I'm referring to it as `genrun`. I added a few functions to automatically wrap native APIs in [this gist](https://gist.github.com/jlongster/5727062). It's very similar to `suspend`, but handles the two fundamental issues differently: it throws errors by default, and automatically handles the `resume` callback, which requires you to wrap every callback-based async function you want to work with.

One thing that surprised me with these libraries is that you can still get try/catch error handling to work, even for errors thrown way down the callback chain, because they are still propagated back to the generator. Another way to put it: multiple callbacks will pass the error along until it hits the final handler, which is the generator, which will throw it. So try/catch still works great for all errors in between `try`.

What you don't get though, is automatic conversions of exceptions into errors for the error callback. Note what I had to do in the library code.

```js
var db = {
    hmset: genrun.bind(client.hmset, client),
    hgetall: genrun.bind(client.hgetall, client)
};

// as top-level code

genrun.run(function*() {
    yield db.hmset('blog::post', {
        date: '20130605',
        title: 'g3n3rat0rs r0ck',
        tags: 'js,node'
    });

    var post = yield db.hgetall('blog::post');
    var tags = post.tags.split(',');

    var taggedPosts = yield run.call(async.map, tags, function(tag, cb) {
        client.hgetall('blog::post::' + tag, cb);
    });

    // do something with tags and taggedPosts

    client.quit();
})();

// as library code

var getPost = genrun.run(function*(callback) {
    try {
        var post = yield db.hgetall('blog::post');
        var meta = yield db.hgetall('blog::post::meta');
        callback(null, { post: post, meta: meta });
    }
    catch(err) {
        callback(err);
    }
});

// getPost(function(err, obj) { ... })
```

Notes:

* Async calls look like normal calls except with `yield`, but you have to wrap functions before hand
* Errors are automatically thrown and can be handled with try/catch
* A library function is the same as before, you take a callback and call it
* Like the suspend library, depends on libraries like `async` for more complex control flow

## Continuable

[Raynos](https://twitter.com/Raynos) pointed out his library [continuable](https://github.com/Raynos/continuable), which looks like some kind of reducer library, which implements generators in [continuable-generators](https://github.com/Raynos/continuable-generators).

```js
// as top-level code

run(function* () {
    yield client.hmset.bind(client, 'blog::post', {
        date: '20130605',
        title: 'g3n3rat0rs r0ck',
        tags: 'js,node'
    });

    var post = yield client.hgetall.bind(client, 'blog::post');
    var tags = post.tags.split(',');
    var taggedPosts = yield list(tags.map(function (tag) {
        return client.hgetall.bind(client, 'post::tag::' + tag);
    }));

    // do something with post and taggedPosts

    client.quit();
})(function(err, res) {});

// as library code

var getPost = run(function*() {
    var post = yield client.hgetall.bind(client, 'blost::post');
    var meta = yield client.hgetall.bind(client, 'blost::post::meta');
    return of({ post: post, meta: meta });
});

// getPost(function(err, obj) { ... })
```

Notes:

* The yielded values are the exact same as the `genrun` library, but instead of separating the wrappings he uses `Function.prototype.bind` to create the callback function. For a lot of code you still probably want to pre-wrap the functions.
* Errors are never thrown, but they are handled automatically. If an error occurs, it stops executing the generator and passes the error to the error handler. This means that you can't handle invidual errors within generators if you wanted to. Also, looks like there has to be a callback function, as you can see in the top-level example (it didn't run without it).
* Library functions are easier to make because `run` returns function which takes a callback, so you don't have to manually call the callback. However, if you wanted to take any arguments, you'd have to do some mangling and manually call it, so it's not really a win. For example:


```js
function getPost(name, callback) {
    run(function*() {
        var post = yield client.hgetall.bind(client, name);
        var meta = yield client.hgetall.bind(client, 'blost::post::meta');
        return of({ post: post, meta: meta });
    })(callback);
}
```

* It comes with several more complex async control operators, like `list` and `of`, so it looks pretty clean.

<a id="co"></a>
## Co

[tjholowaychuk](https://twitter.com/tjholowaychuk) created [Co](https://github.com/visionmedia/co), apparently the night after my [previous post](http://jlongster.com/A-Study-on-Solving-Callbacks-with-JavaScript-Generators) went live.

One interesting thing that was added after I wrote this article is the ability to work with promises, in addition to the normal callback method. The harness which runs the generator checks if the yielded value is a promise, and calls `then` on it. I don't like the duck typing [going on here](https://github.com/visionmedia/co/blob/256db3ee600eb0782c613b85118545d40c217869/index.js#L66) though; basically it checks if it has a `then` property that is a function.

Another thing that was added, thanks to [an idea](https://twitter.com/domenic/status/343120243595567104) by Domenic, was to allow yielding arrays. If this happens, the generator is only resumed when all elements in the array have been called back.

```js
var db = {
    hmset: co.wrap(client.hmset, client),
    hgetall: co.wrap(client.hgetall, client)
};

// as top-level code

co(function*() {
    yield db.hmset('blog::post', {
        date: '20130605',
        title: 'g3n3rat0rs r0ck',
        tags: 'js,node'
    });

    var post = yield db.hgetall('blog::post');
    var tags = post.tags.split(',');

    var taggedPosts = yield tags.map(function(tag) {
        return db.hgetall('blog::post::' + tag);
    });

    // do something with tags and taggedPosts

    client.quit();
});

// as library code

function getPost(callback) {
    co(function*() {
        var post = yield db.hgetall('blog::post');
        var meta = yield db.hgetall('blog::post::meta');
        callback(null, { post: post, meta: meta });
    })(callback);
}

// getPost(function(err, obj) { ... })
```

Notes:

* You need to wrap callback-based functions, like most other libraries
* Errors are automatically thrown, and if they are not caught within the generator, are automatically forwarded to the callback waiting for the generator. Exceptions are converted into errors. If the error isn't caught and there is no callback waiting, it throws it globally. This is actually the best error handling out of all these libraries.
* `Co` doesn't seem to have a way to create a generator but not run it, so for library functions you need some boilerplate. The function `co` has a clever way of installing a callback, which is to call the result, which makes you think the generator isn't run, but it [actually is](https://github.com/visionmedia/co/blob/256db3ee600eb0782c613b85118545d40c217869/index.js#L79).
* Has a [`join`](https://github.com/visionmedia/co#cojoinfn) operator for dealing with arrays

## Q

[Q](https://github.com/kriskowal/q) is the promise library I used in my previous post, and you can see this example written in Q [in the post](http://jlongster.com/A-Study-on-Solving-Callbacks-with-JavaScript-Generators#q-example).

To summarize my previous post for thoroughness, notes about Q:

* Need to wrap native funcs.
* Errors are automatically thrown, and if not handled in the generator are passed forward to the next promise handler, unless `Q.spawn` was used which throws it globally.
* Library functions are easy to create if you can stay in promise land. If you need to also provide a callback interface, it's the same as the above libraries.
* Has an [extensive API](https://github.com/kriskowal/q#tutorial) for more complex async workflow.

## Conclusions

I'm sure there are several more libraries out there experimenting with async generators. I think the above samples show the tradeoffs to be had. Since they mesh nicely with normal callback-style functions, I don't think we need to worry too much about how they look. It's up to you what to choose.

Q promises feel like the right way to do it, and part of me is pulled towards it. But when I look at code like `genrun` I fall in love with the simplicity of it. With promises, my mind has to switch between 3 modes: implicit promises with generators, explicit promises, and callbacks. The cognitive burden of the non-promise library feels much lighter because you only switch between 2 modes: generators and callbacks.

I also don't quite understand how promises are more composable than the above solutions, since they don't break the callback convention at all. Secondly, I'm hesitant about promises converting all exceptions into errors (even ones like `foo is undefined`), which makes me always have to make sure I'm finishing my promise chain correctly (to make errors re-thrown). On the other hand, Q does have the ability to trace the async flow and reconstruct error stacks, which is pretty awesome, and probably why it has such a strict definition of error handling.

You get more power with promises, but at a complexity cost. There's a ton of diversity here, and it would be a mistake to pick one as the winner. The contour and depth of a project's codebase varies drastically, driven not only by requirements but also by personality. Learn deeply about all these approaches, and do what feels right for your project.

## Afterthoughts

## task.js

[task.js](http://taskjs.org/) was an early implementation of using generators to solve callback hell, led by [Dave Herman](https://twitter.com/littlecalculist/) of Mozilla. It was created about a year ago when Firefox was the only one to have generators, and it only works with an older version of the ES6 generators. It implements promises and a scheduler to get something close to cooperative multi-tasking. Even though is it currently out-of-date, it was ahead of it's time and helped spread this idea early on. I wouldn't be surprised if it was updated at some point also, so keep an eye on it.

### Fibers

Somebody mentioned [fibers](https://github.com/laverdet/node-fibers) for node which implements deep coroutines using a native C++ extension. This means that code has access to a "yield" operator, but not only does it suspend the current function, it suspends the entire call stack. If you call a function which yields, your function is suspended as well.

My main problem is that it's hard to write libraries with fibers because you are imposing a vastly different control mechanism on users. It's also a little scary to make the suspension so implicit, because you no longer can guarantee when things are happening.

### Twisted

[Twisted](http://twistedmatrix.com/trac/) is an event-driven engine in Python. I was going to write the same example in Twisted just to compare it, but I ran out of time. I haven't been able to look at it deeply, but we should glance at projects like this and several others that have been dealing with async behavior for years.

### Performance

[Thanasis Polychronakis](https://twitter.com/thanpolas) pointed out his [benchmarks](http://thanpol.as/javascript/promises-a-performance-hits-you-should-be-aware-of/) of various [Promises/A+](http://promises-aplus.github.io/promises-spec/) implementations. He claimed that there is a significant performance hit with promises, so much so that they are "not production grade."

I can't help but feel like this is premature optimization. Focusing solely on the time it takes to run the resolving procedures is like measuring how long it takes to call C functions, and comparing various calling conventions. Of course there will be wildly different results, but we're still in the *milliseconds*, and we are inherently using this stuff to solve I/O-bottlenecked problems. Surely if you take a step back there are much bigger I/O bottlenecks to take care of.

Basically: take it with a grain of salt. Many people have run production code with Q just fine. A few people have had to optimize it, but you can wait until it's clear that your code patterns and scale need better performance than promises.