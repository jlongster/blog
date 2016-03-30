---
shorturl: "Backend-Apps-with-Webpack--Part-III"
headerimg: ""
tags: ["webpack"]
published: true
date: "April 2, 2015"
abstract: "<a href=\"http://jlongster.com/Backend-Apps-with-Webpack--Part-I\">Part I</a> and <a href=\"http://jlongster.com/Backend-Apps-with-Webpack--Part-II\">Part II</a> of this series lay the groundwork for building not only the frontend code of your app, but also the backend. So far, while the system has a nice consistency, it offers little to the casual observer. Today, in this final post, we are going to look at how to live update a running JavaScript system using webpack's hot module replacement.\n"
---

# Live Editing JavaScript with Webpack (Part III)

[bww]: https://github.com/jlongster/backend-with-webpack
[monkey]: https://github.com/jlongster/monkey-hot-loader

[Part I](http://jlongster.com/Backend-Apps-with-Webpack--Part-I) and [Part II](http://jlongster.com/Backend-Apps-with-Webpack--Part-II) of this series lay the groundwork for building not only the frontend code of your app, but also the backend. So far, while the system has a nice consistency, it offers little to the casual observer. Today, in this final post, we are going to look at something that no other build system can touch: using [hot module replacement](http://webpack.github.io/docs/hot-module-replacement.html) to **update a running app live**.

I've always wanted a live environment for JavaScript. There are a few solutions out there, but none of them have the right abstraction. Most of them require you to use a special editor, which is totally backwards. I want to write code in *my* editor, and evaluate it live. 

I used to write Scheme, where live environments are *expected*. It's so addicting that 5 years ago, when I was doing iOS development in Scheme, I made it work directly on a real iPhone and made a somewhat infamous [video](https://www.youtube.com/watch?v=Q7c0rU9Lv28) about it. Later I integrated it directly with my editor, Emacs, which you can see [here](https://www.youtube.com/watch?v=p6k7fjOjqZw). I want this again!

The ideal tool is a networked REPL that is aware of your module system. You could interactively work inside of modules, and build tools on top of it to automatically hot-patch code when a module is changed. Unfortunately this is nearly impossible to build right now, since JavaScript does not natively have modules yet. Additionally, most advanced apps run JavaScript through a transformer like [babeljs](http://babeljs.io/), so somehow the REPL needs to run the code through the same transformers. Making this work in all browsers and node/io.js right now would be really hard. In the long run, when native devtools get support for modules, it should be possible.

However, you can sit down *today* and use [webpack](http://webpack.github.io/docs/)'s [hot module replacement](http://webpack.github.io/docs/hot-module-replacement.html) to achieve something similar. This works in all browsers and backend environments, and runs code through all your code transformers.

[react-hot-loader](http://gaearon.github.io/react-hot-loader/) is an excellent project started by [Dan Abramov](https://twitter.com/dan_abramov) (whom you really should follow) that inspired this post. You may already use it to live update your React frontend. My work uses the same techniques to patch JavaScript more generally, which is useful for stateful backend servers (or if your server is simply slow to restart).

The following video demonstrates this functionality with webpack and a loader I just released, [monkey-hot-loader][monkey]. All that's required to patch the live system is to **save the file**. The finished product below is available at the [backend-with-webpack][bww] project if you want to play with it.

<div class="offset-77">
<iframe width="854" height="510" src="https://www.youtube.com/embed/ZleaWPpUM3Y" frameborder="0" allowfullscreen></iframe>
</div>

Right now [monkey-hot-loader][monkey] only supports patching top-level functions in each module. This is a just a start and we could implement various kinds of patching, like hot-updating classes by rewiring their prototypes to the new instance.

To be upfront, [monkey-hot-loader][monkey] is abusing webpack's HMR system to basically get a per-module `eval`. The system isn't really meant to do this, and there are a few constraints, but we also get a lot of stuff for free. I will explain how it works and all the tradeoffs below.

Check out the [project's documentation](https://github.com/jlongster/monkey-hot-loader#monkey-hot-loader) to see how to integrate in your app.

If you don't care about all the details below, you can play with this by checking out the new version of [backend-with-webpack][bww]. Just run `npm install` and `gulp run` and you should have a working system that is patchable. Try changing some of the functions!

## Webpack Infrastructure

[Webpack](http://webpack.github.io/docs/) is a module bundler with lots of features for controlling how modules are transformed and bundled. It also has this thing called [hot module replacement](http://webpack.github.io/docs/hot-module-replacement.html), which is a technique for live reloading modules.

Here's a high-level overview. First, the webpack compiler needs to communicate somehow with the running app. The compiler watches for changes, recompiles modules, and notifies the running app that an update is pending (via a websocket connection, unix signal, or anything else).

![](http://jlongster.com/s/upload/webpack-hot1.png)

The running app then fetches the updated module's source and runs it, calling specific API functions on the outdated module to give it chance to update itself. You can find a lot more details in [the docs](http://webpack.github.io/docs/hot-module-replacement-with-webpack.html).

Let's say module B was updated in the image above and call it B'. Webpack simply runs the module, but how does it actually get updated in the live system? The dependency chain needs to be updated. The modules that B depend on are fine; B' simply requires them and gets the same instances. However, we want to A to now pull in B' instead of B.

The design of the current API in webpack is to "bubble up" module changes. To get B' in the system, webpack will walk up the dependency chain and re-run each module until it hits a module that "accepts" the changes. At the bottom of the module, you write this code to accept a change:

```js
// all of module A's code...

if(module.hot) {
  module.hot.accept();
}
```

Calling this `accept` API tells webpack that the update was accepted. You can pass specific dependencies to catch, like `module.hot.accept('./foo.js', function() { ... });`, if you want to just catch those specifically. The callback is called whenever dependencies are updated. An update fails if it never gets accepted.

This code is run in the *new* module, so when B' comes into the system A is re-run as A' and it accepts the change. The idea being that usually you only need to call this `accept` function at the root module, and updated modules will automatically bubble up and update the dependency chain. You could also call `accept` in in specific modules when you stop the bubbling.

The image below illustrates the state of the system after B is updated. The green modules are new instances, and green lines are the new dependency structure.

![](http://jlongster.com/s/upload/webpack-hot2.png)

Obviously this causes problems with stateful modules. If you have a stateful module, you need to take special care to patch it manually yourself when it's re-run so that the state stays in tact using [dispose](http://webpack.github.io/docs/hot-module-replacement.html#dispose-adddisposehandler). [HMR APIs](http://webpack.github.io/docs/hot-module-replacement.html) allow you to control various patching behavior.

To be honest, I find this part of the infrastructure non-intuitive, and it forces you to write special "hot patching" code too often. I'm all for stateless modules, but having to think about that at all is annoying.

What I *really* want is simply an `eval` inside each module. That's all I really care about, and I'm about to abuse webpack's HMR to get it.

Why deal with HMR if that's all I want? We get to reuse all of the infrastructure for communicating between the compiler and the running app, and code is also run through all the webpack loaders. Getting this for free cannot be understated. We instantly get a connection to all browsers and node/io.js, **as well as transformations** like [babeljs](http://babeljs.io/).

### Caveat

We abuse webpack's HMR because we avoid bubbling altogether. Every single module "accepts" updates to itself and stops bubbling. We don't need bubbling because we live modify the original module itself, so the dependency chain immediately sees the updates.

There is one caveat to be aware of. A side effect of this is that the HMR system always evaluates the entire module again when it is updated. What's supposed to happen is the module is run again and the dependency chain updates to point to the new module. However, we just want the original module to eval some new code; we don't need the entire module to be evaluated again, and monkey-hot-loader has to hack around this.

This means that if your module has any side effects, like starting a server, it won't work well with monkey-hot-loader. It's OK if there's global state, but there shouldn't be any IO. react-hot-loader has this problem too, but it's even more annoying for monkey-hot-loader as you will see below.

## Hot Patching Heuristics

As mentioned above, we don't really use HMR the way we're supposed to. When a module is changed, we take it and monkey-patch the original module with the updates. Remember the image above illustrating what happens when B is updated? Here's what it looks like in our new system:

![](http://jlongster.com/s/upload/webpack-hot3.png)

We rewire the bindings in the original module to point to our new code (could be function, class methods, or something else). This is exactly how [react-hot-loader](http://gaearon.github.io/react-hot-loader/) works; it patches all the methods of a React component to use the new methods.

The question is how to patch the original module, or what to rewire. It gets extremely complicated if you try and accept *any* update, only patching the part of the system that changed. For example, what if I changed code inside of a closure? It's hard to patch the closure without losing the existing state. We might be able to do it using the engine's debugger API, but it's difficult to make that work everywhere.

I say **forget about all those nasty edge cases**. Keep it simple. Patching closures is overrated. It turns out that only allowing very basic patching works really well. Intuitively it's easy to keep track of how everything works.

Different contexts call for different patching heuristics. If you are using React on the frontend, most of your code is inside react components and react-hot-loader works great. However, on the backend most of your code might be classes with methods, so patching the methods on the prototypes works well.

Let's start with a *really simple* heuristic: patch only top-level functions inside a module. That means only functions of the form `function foo() { ... }` at the top-level of a module are going to be updated. This encourages simple code that is testable anyway.

Obviously this is too simple for a lot of systems, but it makes for a good demo. Being able to also update methods of classes is very important, and I bet that would cover a ton of JavaScript code.

Currently monkey-hot-loader implements this top-level function patching as an initial experiment. I would love to see class patching as well. Play with it by using the [backend-with-webpack][bww] project, or visit [monkey-hot-loader][monkey] to see how to integrate with your app.

### Patching Top-Level Functions

In this section I will explain how patching top-level functions works in detail.

monkey-hot-loader is a webpack loader that parses the JavaScript file and extracts all the names of the top-level functions in the file. For example, take a look at the following code:

```js
function foo() {
  return 5;
}

function bar() {
  return function() { 
    // ...
  }
}

module.exports = function() {
  // ...
}
```

The current version of monkey-hot-loader will only extract the names `foo` and `bar`. Only these functions are patchable. We could probably make a few other types of functions patchable, but let's keep it simple for now.

We can patch `foo` and `bar` by simply setting them to new functions. Because they are simple top-level functions, the updated functions will be created in the exact same scope. It's easy to inject new code there.

The only major problem is if the function was exported, modules using the exported function would still reference the old version. We have to do quite a bit of work to get around that.

First, the names of these functions are given to the [runtime code](https://github.com/jlongster/monkey-hot-loader/blob/master/patcher.js) that monkey-hot-loader appends to each module. When the module runs for the first time, it will iterate over these names and make each function "patchable" by replacing it with this:

```js
var patched = function() {
  if(patchedBindings[binding]) {
    return patchedBindings[binding].apply(this, arguments);
  }
  else {
    return f.apply(this, arguments);
  }
};
patched.prototype = f.prototype;
```

`f` here would reference `foo` if we were patching it. The interesting thing is that the semantics of `patched` should be *exactly* the same as `f`. Any call to `patched` should produce the exact same result as a call to `f` (even `new f()`). I haven't been able to find any cases where this is not true.

With the initial semantics of `foo` in tact, we've installed a hook to check if there's a new version of the function to call. After all top-level functions are replaced with this version, we can simply override any of them by loading a function into `patchedBindings`, and even exported functions will call the new version.

We install these patched versions in the module's scope [with `eval`](https://github.com/jlongster/monkey-hot-loader/blob/be3d181ac62937581aa49258b9ed28be389a5589/patcher.js#L86).

The last thing we need is to *save this modules scope*. Remember, this is all only happening the **the first time** the module runs. We need the ability to later *eval* code in this specific scope, which maintains any state. This can be done by creating an [eval proxy](https://github.com/jlongster/monkey-hot-loader/blob/be3d181ac62937581aa49258b9ed28be389a5589/patcher.js#L68-L70):

```js
var moduleEval = function(code) {
  return eval(code);
}
```

This function is later passed onto future versions of this module via webpack's [`dispose`](http://webpack.github.io/docs/hot-module-replacement.html#dispose-adddisposehandler) handler.

While all of the above happens on the first run of a module, subsequent updates take a different code path. The entire module is evaluated again, but this time we [iterate over each of the top-level bindings](https://github.com/jlongster/monkey-hot-loader/blob/be3d181ac62937581aa49258b9ed28be389a5589/patcher.js#L103-L115), call `func.toString()` to get the function code, and re-eval it in the original module's scope using `moduleEval` (so it references the original state). Finally, we install it in `patchedBindings` so that the system uses it in all future calls.

```js
bindings.forEach(function(binding) {
  // Get the updated function instance
  var f = eval(binding);

  // We need to reify the function in the original module so
  // it references any of the original state. Strip the name
  // and simply eval it.
  var funcCode = (
    '(' + f.toString().replace(/^function \w+\(/, 'function (') + ')'
  );
  patchedBindings[binding] = module.hot.data.moduleEval(funcCode);
});
```

Ugly, I know! But it works pretty damn well. Ideally, we could somehow just get the raw source of the updated module and avoid actually running the module since we just want the code as a string anyway.

It's possible that we could avoid the entire `func.toString()` and `moduleEval` and just not support global state. However, global state can be useful for debugging, especially for REPL-style interactions which I'd like to have in the future. Interestingly, classes don't have this problem as much as all state is part of the instance (which is why react-hot-loader works fine without this hack).

I glossed over a few details, but hopefully that overview makes sense.

### __eval

There's one last trick, and it's the biggest hack in this whole post. I really want a REPL that evals code inside a module, and you could "open" modules to choose which context to eval in. We can't do that with this infrastructure, but we can get halfway there.

```js
function __eval() {
  var user = getLastUser();
  console.log(findAllDoughnutsEaten(user));
}
```

If you define a function named `__eval`, monkey-hot-loader will execute it every single time the module is updated. As you can see in the video, this is super useful for instant feedback. You could call some APIs and log the result, and then *work on* those APIs until you see the result you want. All you have to do is change some code, save the file, and you instantly see the updated output.

You could use the code from `__eval` as global code and webpack's normal HMR system will run the module every time its updated. But I don't like the bubbling mechanism and any module with side effects has to have special code. You also can't build up some state across evals to play with or debug code.

It's a very rough version of the old Lisp-style "select some code and press Ctrl-E to run it". Here it's "write some code in `__eval` and save the file to run it". The nice part is that `__eval` is *per module*, so you can select which context you want to run code in.

A challenge with JavaScript's `eval` function is that, in strict mode, you can't introduce new variables (`var x = 5` doesn't do anything). This is really annoying because with `__eval` you frequently want to add some debugging variables to track state. There's [some code](https://github.com/jlongster/monkey-hot-loader/blob/be3d181ac62937581aa49258b9ed28be389a5589/patcher.js#L53-L66) in monkey-hot-loader to get around this, but there might be better way.

## Dreamy Thoughts

Will it blend? I don't know. Maybe I'm trying too hard to use webpack's HMR for something it isn't built for at all. Dreams of my old Scheme days make me thirst for a proper live REPL in JavaScript. The REPL used to be my point of inspiration. It was the [paint brush with which I'd paint](https://www.youtube.com/watch?v=p6k7fjOjqZw).

Those REPLs had the super power of opening modules. [Scheme48](http://s48.org/)'s REPL was incredible. You could pry open a module, evaluate some code in it, close it, and pry open another one. You could inspect all sorts of information about modules, and reload them easily. And of course Emacs integration made this pure bliss. You can't understand until you've tried it.

Those REPLs also weren't simple `eval` calls. They were also debuggers. If something went wrong, my REPL would turn into a command line debugger like gdb, the engine paused at the offending piece of code. I love browser's JS debuggers (heck, I work on Firefox's debugger), but there's something about not having to leave your environment.

I'm being somewhat hyperbolic, and there are a lot of great IDEs these days. It's tough for JavaScript though because modules don't officially exist yet, and there are so many platforms (node, chrome, firefox, etc). One tool that I discovered while writing this was [Amok](https://github.com/caspervonb/amok), which seems to have the right goal. The core functionality seems to just be a thin wrapper around V8's debugger API to set an arbitrary function's source, but it's doing interesting things with the network infrastructure. I wish it would focus on a simple REPL instead of editing closures in place, though. You could build a workflow for "save a file and update the functions" on top of that.

If you're interested in this, you might want to try out [ClojureScript](https://github.com/clojure/clojurescript). A live REPL still reigns in the Lisp world, with [multiple](https://github.com/plexus/chestnut) [options](https://github.com/bhauman/lein-figwheel) available, even an [iOS REPL](https://github.com/omcljs/ambly).

I hope [monkey-hot-loader][monkey] works for you, and if interested, I'd love to hear your ideas how it could become something useful for everybody. Play with all of this right now by checking out the [backend-with-webpack][bww] project.

<style type="text/css">.offset-77 { margin-left: -77px; }</style>
<style type="text/css">.post-page article img { max-width: 800px; width: 800px; margin-left: -50px; }</style>
