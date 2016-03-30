---
tags: ["nunjucks"]
published: true
date: "December 4, 2013"
readnext: "A-Study-on-Solving-Callbacks-with-JavaScript-Generators"
abstract: "I wrote a JavaScript engine called Nunjucks, and it recently reached 1.0. One the new features is asynchronous templating, which lets you use async APIs inside custom filters and extensions. I'll show you how I implemented it, allowing templates to be paused when rendering and resumed later."
shorturl: "A-Deep-Dive-into-Asynchronous-Templating"
headerimg: "http://jlongster.com/s/post-headerimgs/postbg-nunjucks.png"
---

# A Deep Dive into Asynchronous Templating

I wrote a JavaScript templating engine called [Nunjucks](http://jlongster.github.io/nunjucks/). Recently it reached 1.0 and one of the new features is asynchronous templating. You may be wondering, like I was a few months ago, what does that even mean?

I tend to prioritize feature requests by popularity, and one of the features that kept coming up was *asynchronous templates*. It took me a while to figure out what people meant by that, and I think the result is quite interesting.

Nunjucks does a lot of things, like loading templates, calling filters, and more. All of this is synchronous by default (which isn't a problem for loading templates, since they are loaded once and cached forever). This limits what you can do in filters and template loaders, since you can't use any async functions.

<div class="definition clearfix">
  <span>Asynchronous templates</span> can be paused in the middle of rendering and resumed later.
</div>

This hasn't been a problem for a long time, and for most people never will be a problem. You don't want to mix too much logic with your templates, so you usually do all the complicated async work in a controller and pass the data to the template.

However, I can imagine sites that are heavily template-driven and developers wanting to wrap up some sort of behavior that depends on an async operation into a filter or custom tag. Nunjucks is built to allow people to add logic to their templates as needed, and works great for large content-heavy projects where not everybody is familiar with the backend.

Regardless, I think asynchronous control is an interesting feature that doesn't adversely effect existing templates, so I decided to dig into it. Here's what I came up with.

## A Basic Example

In nunjucks, you can define [filters](http://jlongster.github.io/nunjucks/api.html#custom-filters) that are used in templates like so:

```jinja2
Hello {{ user | formatName }}!
```

The way you create filters looks like this:

```js
var env = nunjucks.configure('views');

env.addFilter('formatName', function(user) {
   return user.firstname + ' ' + user.lastname;
})
```

This means that you can define points in the template which call out to custom JavaScript code. There are two other places this can happen: [extensions](http://jlongster.github.io/nunjucks/api.html#custom-tags), which let you create custom tags that process content at run-time, and [loaders](http://jlongster.github.io/nunjucks/api.html#writing-a-loader) which let you handle how templates are loaded when a block like `include` or `extends` is hit.

The problem is that if you want to use any asynchronous API in your custom code, you can't. The previous nunjucks API only supported synchronous functions which returned a value at the end.

For example, let's say you wanted to load a value from a database in a filter:

```js
env.addFilter('getCategory', function(item) {
    db.get('item-category-' + item.id, function(err, res) {
       return res;
    });
})
```

That won't work. The `getCategory` filter returns `undefined` because nothing is actually returned, so nothing gets rendered. The async call is just ignored because there's nothing it can do in the callback.

This is the technical reason why asynchronous templates are necessary. If we want to support asynchronous behavior in custom code, everything up the stack needs to be asynchronous as well. This means that all of the template code becomes asynchronous, so template rendering can be "paused" and resumed at a later time.

## The Solution

As of nunjucks 1.0, you can write [asynchronous filters, extensions, and loaders](http://jlongster.github.io/nunjucks/api.html#asynchronous-support). Because async work might happen, all of the API calls must be async as well, such as `render`. Here's an example that creates an async filter and renders a template:

```js
env.addFilter('getCategory', function(item, cb) {
    db.get('item-category-' + item.id, cb);
}, true)

env.render('foo.html', function(err, res) {
    // ...
})
```

Asynchronous style is completely optional in nunjucks. I made it that way because I believe 99% of templates will not use it, and it sucks to enforce such a big change for a rarely used feature. That's why you need to pass `true` to `env.addFilter` as the last argument, which tells nunjucks to give you a callback for async work. Otherwise the system will assume your filter is synchronous.

Note that `env.render` now takes a callback instead of returning the rendered template. Everything up the stack has to be asynchronous as well for templates to be paused/resumed.

Extensions and loaders have similar ways to mark them as async. Since everything is implicitly synchronous, the async work is marked explicitly. Nunjucks is able to take advantage of this for performance as you will see in the next section.

If you never use any asynchronous filters, extensions, or loaders, you can still simply just write `var res = env.render('foo.html')`.

## Implementation Details

Nunjucks has always been a really fast templating engine because it compiles templates to straight-forward code. For example, look at this template:

```jinja2
{% for item in items %}
  {{ item.name }} last seen {{ item.id | getLastSeen }}
{% endfor %}
```

This compiles to:

```js
function root(env, context, frame, runtime, cb) {
  var lineno = null;
  var colno = null;
  var output = "";
  try {
    output += "\n";
    frame = frame.push();
    var t_3 = runtime.contextOrFrameLookup(context, frame, "items");
    if(t_3) {
      for(var t_1=0; t_1 < t_3.length; t_1++) {
        var t_4 = t_3[t_1];
        frame.set("item", t_4);
        output += "\n  ";
        output += runtime.suppressValue(runtime.memberLookup((t_4),"name", env.autoesc), env.autoesc);
        output += " last seen ";
        output += runtime.suppressValue(env.getFilter("getLastSeen").call(context, runtime.memberLookup((t_4),"id", env.autoesc)), env.autoesc);
        output += "\n";
      }
    }
    frame = frame.pop();
    output += "\n";
    cb(null, output);
  } catch (e) {
    cb(runtime.handleError(e, lineno, colno));
  }
}
```

While there is a bunch of boilerplate to handle scoping, autoescaping, and other features, it basically boils down to a simple `for` loop and string concatenation. The philosophy of nunjucks has been to compile out to *unsurprising* JavaScript, which makes it really fast.

But to support asynchronous behavior, we need to radically transform the generated code so that the template can be "paused" at any point and then picked up later when the async work is done. Performance would suffer greatly from that kind of code, unfortunately, as every operation needs to be wrapped in some kind of delayed fashion. Imagine trying to pause it in the middle of the `for` loop; you can't, so you have to use a custom iteration mechanism to control it and you lose simplicity and performance.

Worse, this major (unbenchmarked but obvious) performance hit is for a feature that most people won't use. There is a **key insight** that will solve the performance problem, though.

Before we dig into nunjucks, it's worth mentioning [dust.js](http://akdubya.github.io/dustjs/) which is the only other templating engine I know of that is asynchronous. It's easy to see how it works if you look at the example on the homepage:

```
Hello {name}! You have {count} new messages.
```

compiles to:

```js
(function() {
  dust.register("demo", body_0);

  function body_0(chk, ctx) {
    return chk.write("Hello ")
       .reference(ctx.get("name"), ctx, "h")
       .write("! You have ")
       .reference(ctx.get("count"), ctx, "h")
       .write(" new messages.");
  }
  return body_0;
})();
```

The code it generates chains together every single step of the rendering, so nothing is eagerly evaluated. It has its own iterator for looping and isn't able to take advantage of JavaScript optimizations. However, dust.js is a very cool templating language, and the performance might be fine for you. It's able to do lots of cool stuff like streaming templates because of how it's structured. However, nunjucks templates tend to be large and very fast and I wanted to keep it that way.

### Key Insight

There is a particular characteristic of asynchronous nunjucks templates that we can take advantage of: asynchronous work can *only* be triggered within filters, extensions, and loaders that are explicitly marked asynchronous. That means that only at those places do we need to worry about asynchronous transformations; everything else can be synchronous.

You'll see the great benefits we can reap from this property below.

### Transformation

So what kind of generated code do we need to produce? Let's start with a basic example and go from there.

```jinja2
Hello {{ user.name }}, last logged in {{ user.id | getLastSeen }}
```

This template compiles to:

```js
function root(env, context, frame, runtime, cb) {
  var lineno = null;
  var colno = null;
  var output = "";
  try {
    output += "\nHello ";
    output += runtime.suppressValue(
        runtime.memberLookup(runtime.contextOrFrameLookup(context, frame, "user"),"name", env.autoesc),
        env.autoesc
    );
    output += ", last logged in ";
    output += runtime.suppressValue(
        env.getFilter("getLastSeen").call(context, runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "user")),"id", env.autoesc)),
        env.autoesc
    );                                                                                                                                                                        
    output += "\n";
    cb(null, output);
  } catch (e) {
    cb(runtime.handleError(e, lineno, colno));
  }
}
```

In this template, we only need to worry about the `getLastSeen` filter being asynchronous. The code above calls it synchronously and expects it to return a value. What if we changed the compiler to generate the following code?

```js
function root(env, context, frame, runtime, cb) {
  var lineno = null;
  var colno = null;
  var output = "";
  try {
    output += "\nHello ";
    output += runtime.suppressValue(
        runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "user")),"name", env.autoesc),
        env.autoesc
    );
    output += ", last logged in ";
    env.getFilter("getLastSeen").call(
        context,
        runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "user")),"id", env.autoesc),
        function(t_1,hole_0) {
          if(t_1) { cb(t_1); return; }
          output += runtime.suppressValue(hole_0, env.autoesc);
          output += "\n";
          cb(null, output);
        }
    );
  } catch (e) {
    cb(runtime.handleError(e, lineno, colno));
  }
}
```

Now it calls the `getLastSeen` filter with a callback, which renders the rest of the template. I know the code is a little dense, but I want to keep it real compiled code from nunjucks so you really see how it works.

It's important to see that the callback contains the entire code for the rest of the template. You can see if better if I add more stuff to the template:

```jinja2
Hello {{ user.name }}, last logged in {{ user.id | getLastSeen }}. Today is {{ day }}!
```

The filter call would become:

```js
env.getFilter("getLastSeen").call(
  context,
  runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "user")),"id", env.autoesc),
  function(t_1,hole_0) {
    if(t_1) { cb(t_1); return; }
    output += runtime.suppressValue(hole_0, env.autoesc);
    output += ". Today is ";
    output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "day"), env.autoesc);
    output += "!\n";
    cb(null, output);
  }
)
```

Since we only have to watch out for filters, extensions, and loaders we can add asynchronous support rather easily into our existing linear code. Internally, as the compiler emits sequential statements, it keeps track of a current "scoping level" so it knows how many functions to close at the end of the template.

Here's a really high-level overview. Previously nunjucks simply walked through a list of expressions and generated code for each of them, so it was sequential like this:

```js
output += expr1
output += expr2
output += expr3
output += expr4
output += expr5
output += expr6
```

Now, if `expr2` and `expr4` is asynchronous, we generate the opening of a callback function, [add a scoping level](https://github.com/jlongster/nunjucks/blob/master/src/compiler.js#L479) so it is closed at the end, and continue generating code:

```js
output += expr1
expr2(function(err, res) {
  output += res
  output += expr3
  expr4(function(err, res) {
    output += res
    output += expr5
    output += expr6
  })
})
```

Although the asynchronous expressions generate slightly different code now, the rest of the expressions are generated exactly the same as before. It just so happens that syntactically they are wrapped in the callback. In this way we defer the rest of the template by sticking it all into the callback function. It works just as good if there are multiple callbacks (produced by multiple asynchronous forms).

### Iteration

So we've successfully transformed the generated code to support asynchronous control (the above technique can be triggered also by an async extension or loader)! Unfortunately it breaks down if you do anything async inside a `for ` loop.

The plague of asynchronous behavior is that *everything* must be asynchronous. You can't call an async API inside a normal JavaScript `for` loop; there's no way to "pause" the iteration.

That means that we can't use `for` loops anymore. Nunjucks will generate code that uses our own iterator, `asyncEach`:

```jinja2
{% for item in items %}
  {{ item.name }} last seen {{ item.id | getLastSeen }}
{% endfor %}
```

```js
function root(env, context, frame, runtime, cb) {
  var lineno = null;
  var colno = null;
  var output = "";
  try {
    output += "\n";
    frame = frame.push();
    var t_3 = runtime.contextOrFrameLookup(context, frame, "items");

    runtime.asyncEach(t_3, 1, function(item, t_1, t_2,next) {
      frame.set("item", item);
      output += "\n  ";
      output += runtime.suppressValue(runtime.memberLookup((item),"name", env.autoesc), env.autoesc);
      output += " last seen ";
      
      env.getFilter("getLastSeen").call(context, runtime.memberLookup((item),"id", env.autoesc), function(t_4,hole_0) {
        if(t_4) { cb(t_4); return; }
        output += runtime.suppressValue(hole_0, env.autoesc);
        output += "\n";
        next(t_1);
      });
      
    }, function(t_6,t_5) {
      if(t_6) { cb(t_6); return; }
      frame = frame.pop();
      output += "\n";
      cb(null, output);
    });
  } catch (e) {
    cb(runtime.handleError(e, lineno, colno));
  }
}
```

`asyncEach` calls a callback with a few arguments, most notably `next` which is called when it should move to the next item. We use the same technique of playing around with scoping levels but still in general just generating sequential statements that render the template.

### Lifting Expressions

So we're done, right? Not exactly. Nunjucks supports complex expressions like this one:

```jinja2
Hey {{ foo(1, 2, username | title ) }}
```

This compiles out mostly to a normal JavaScript function call, and our transformation would break because it expects to be at the top-level. It would generate something like `foo(1, 2, getFilter('title').call(this, username, function(err, res) {)`. Even if it were syntactically valid, the filter call wouldn't return anything. We need to convert the whole expression to be asynchronous.

Sound complicated? I hope you're not feeling like this:

![](http://jlongster.com/s/posts/nunjucks-dog.jpg)

Because it's actually pretty easy to fix. I know this post is quite dense, but dogs make everything better, right? And if you skipped down here, seriously, go back up!

What we need to do is **lift** all the asynchronous filters into the outer scope, and then evaluate the expression. We can do this because it's not valid to mutate anything within an expression, so we can guarantee the same effect if we evaluate all the async stuff first and then simply fill in the original locations with the results.

If we were in JavaScript, the transformation would look like this:

```js
foo(1, 2, title(username, function(err, _username) {}));

// into

title(username, function(err, _username) {
  foo(1, 2, _username)
});
```

Indeed, you can see this pattern in the generated code for the original expression:

```js
function root(env, context, frame, runtime, cb) {
  var lineno = null;
  var colno = null;
  var output = "";
  try {
    output += "\nHey ";
    env.getFilter("title").call(context, runtime.contextOrFrameLookup(context, frame, "username"), function(t_1,hole_0) {
      if(t_1) { cb(t_1); return; }

      output += runtime.suppressValue(
        runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "foo"), "foo",
                         [1, 2, hole_0]),
        env.autoesc
      );

      output += "\n";
      cb(null, output);
    });
  } catch (e) {
    cb(runtime.handleError(e, lineno, colno));
  }
}
```

The `title` filter is called first and then in the callback `foo` is called with `hole_0`, which is the result of the `title` filter. You can lift as many asynchronous filters as needed, as long as you evaluate them in the same order as they are found.

The lifting step introduces a new phase in the compiler: transforming. Previously a template was parsed into an AST, and then the AST was compiled. Now after the parser makes an AST, it is passed through a [transformer](https://github.com/jlongster/nunjucks/blob/master/src/transformer.js) which does all the lifting, and then the compiler takes the final AST and compiles it to JavaScript.

### Optimizing for the Common Use Case

At this point, we finally have robust asynchronous templates. But hold on now, didn't I bemoan the loss of real `for` loops and code simplicity? Indeed, a quick benchmark of our new code shows a big drop in performance! (I don't remember how much, but it was somewhere around 2x-3x drop). This is sad.

Since most people won't even do asynchronous work, what if we could generate asynchronous code *only when actual asynchronous filters/extensions/loaders are used*?

If we require asynchronous filters and extensions to be known at compile-time, we can be very optimistic with the generated code. Let's ignore loaders for now, as they have some edge cases that aren't worth discussing.

Let's take the basic example again:

```jinja2
Hello {{ user | formatName }}!
```

If we have a list of names of all the asynchronous filters, we can check if `formatName` is asynchronous. If it is not, the compiler can generate fast synchronous code and forego the callback mess.

This is *groundbreaking* because suddenly we can deduce if a whole chunk of code is asynchronous or not. For example, look at this example again:

```jinja2
{% for item in items %}
  {{ item.name }} last seen {{ item.id | getLastSeen }}
{% endfor %}
```

We can actually scan the entire code within the `for` loop and check to see if any asynchronous filters are used. If they aren't, we can fall back to a normal (and highly performant) JavaScript `for` loop!

You can see this happening [here](https://github.com/jlongster/nunjucks/blob/master/src/transformer.js#L174) in the AST transformer. When it hits an `if` or `for`, it scans all the nodes inside and checks for any async nodes. If it finds any, it converts the `if` or `for` into an `IfAsync` or `AsyncEach` node, which generates async code instead, and continues walking up the AST.

Now the generated code is by default synchronous (and fast!) just like it was before any of this happened, but you can trigger asynchronous code generation when you need it.

### And We're Done!

That was a whirlwind tour of how I implemented asynchronous templating in nunjucks. I thought it was an interesting exercise and I was happy that I was able to keep normal synchronous templates (which is by far the most common) fast like they've always been.

## Parallel Execution

Now that we have asynchronous ability, we should take advantage of it. There is a lot more nunjucks could do, but I'm taking it slowly to see how users use it. The nice thing is that you can abstract away complex asynchronous scenarious that would result in complicated code.

Take an asynchronous `map`, for example. If you have an array of items, and want to do something asynchronous to all of them in parallel, it gets complex with error handling (promises help, but it's still verbose). Maybe you can just use the new nunjucks tag, [`asyncAll`](http://jlongster.github.io/nunjucks/templating.html#asyncall), which renders all items in parallel:

```jinja2
{% asyncAll item in items %}
  {{ item.id | lookupName }}
{% endall %}
```

It's exactly like `for` but fires off the rendering for each item in parallel, and when all of them are finished renders the completed output in the right order. If `lookupName` is asynchronous, you'll get a nice speedup doing this in parallel. If you don't do anything asynchronous inside the loop, it just renders sequentially.

We could possibly implement streaming templates, more powerful parallel execution, and all kinds of things, but I'm not sure those needs are a good fit for nunjucks. In the future, they might be.

## Conclusion

I hope you enjoyed this, and you can read more specific details about asynchronous support in [the docs](http://jlongster.github.io/nunjucks/api.html#asynchronous-support). As always, I'm happy to answer questions on the [mailing list](https://groups.google.com/forum/?fromgroups#!forum/nunjucks).

<link rel="stylesheet" type="text/css" href="/css/posts/nunjucks-async.css" />

