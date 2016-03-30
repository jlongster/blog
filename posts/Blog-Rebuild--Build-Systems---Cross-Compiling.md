---
tags: ["blog","rebuild"]
published: true
date: "August 14, 2014"
readnext: "Blog-Rebuild--A-Fresh-Start"
abstract: "To begin rebuilding my blog, I need a way to cross-compile JavaScript and have modules work in the browser. In this article, I describe all the research I did into build systems and what I ended up with."
shorturl: "Blog-Rebuild--Build-Systems---Cross-Compiling"
headerimg: "https://insitebuilders.files.wordpress.com/2008/09/method-systems.jpg"
---

# Blog Rebuild: Build Systems & Cross-Compiling

*This is an entry in a series about rebuilding my custom blog with react, CSP, and other modern tech. [Read more](http://jlongster.com/tag/rebuild) in the blog rebuild series.*

A few years ago I remember being surprised at how popular [grunt](http://gruntjs.com/) was getting. Not because it wasn't great software, but because I didn't understand what problem it solved. If I needed to process a few things like CSS before deploying to production, `make` seemed to work just fine.

Back then I thought things like build steps for JavaScript were an unnecessary complexity. I couldn't have been more wrong. A build system adds some complexity, yes, but a good one like [gulp](http://gulpjs.com/) or [broccoli](https://github.com/broccolijs/broccoli) is simple enough, and the returns are enormous. A complex `Makefile` for a JavaScript project would be a mistake, but these build tools are great.

**tl;dr** I chose gulp as my build system and webpack as my client-side module bundler. My final setup is [on github](https://github.com/jlongster/jlongster-rebuild/), specifically [gulpfile.js](https://github.com/jlongster/jlongster-rebuild/blob/master/gulpfile.js) and [webpack.config.js](https://github.com/jlongster/jlongster-rebuild/blob/master/webpack.config.js).

## A Practical Approach

I'm going to be as practical as possible during this rebuild. I'm going to investigate newer things like ES6 modules, but if the tools are too immature I will fallback to something like CommonJS. I want something that works now with little effort.

What I need:

1. A common module format for the client and server. Node uses CommonJS, and currently browsers do not enforce modules.
1. For client-side code, a way to compile modules to run in the browser.
1. An extensible pipeline for hooking in compilation stages for both server and client JS. This lets me hook in various JS transformations that I need.
1. A watcher that will automatically trigger the necessary compilations to get updates automatically (and only re-compile the necessary files)
1. Ability to define a few basic build tasks for moving files around and running the app

There are lots of things involved in the above requirements: compilation strategies, module bundling, and build task management. I don't know yet which combination of projects will work out, so let's investigate various solutions.

The main drive for a compilation pipeline is to compile out ES6 features into ES5. I don't want to hook something big like Traceur in because there are projects that compile out specific features better. For example, I want to use [regenerator](https://github.com/facebook/regenerator) to compile out generators and then [defs](https://github.com/olov/defs) to compile out `let`. I've always enjoyed [this post](http://blog.fogus.me/2012/04/25/the-clojurescript-compilation-pipeline/) about ClojureScript's compilation pipeline, and I'm reminded of it when I think of this strategy of incrementally compiling an AST. Ideally, we will pass an AST around, but we'll see if the tools are good enough for that yet.

Of course, I'm a big fan of [sweet.js](http://sweetjs.org/) so that will be the first compilation phase. I may compile out some ES6 features with the [es6-macros](https://github.com/jlongster/es6-macros) project, but the reality is that the JS community has written mature ES6 transformations in the form of compilers, so it might make sense just to use them. I will still use macros for user-land syntax extensions, which I'll talk more about in future posts.

## The Core Problem

I think the core problem is that the client and server are very different beasts. Node requires CommonJS and modules separated out into individual files. Browsers don't have modules and it's desirable to bundle everything together into a single JS file to deploy. To make things harder, everything should be sourcemapped.

The first question to ask is how a build system can help. Since we want to work with modules, we need support for N:M files at each build step. That means that given N files, a build step can produce M files. For example, given 1 file, a module plugin will return 10 files (all the dependencies), and then the next step could bundle them all together into 1 file.

This is important for **watching** and **incremental builds**. If a dependency changes, even if it's not listed directly in the files to watch, the build system should recompile. Additionally, it should *only* recompile the necessary changes, so it should cache each dependency, even if it's not explicitly listed in the original sources.

The second question to ask is what tools are out there for working with modules. The build system is the backbone, but we need plugins for actually doing things with modules. How well the build system supports N:M files affects how much the module loaders need to do.

Lastly, there's one more desirable feature. There are several transformations I want to do to my code (like [sweet.js](https://github.com/facebook/regenerator) &#8594; [regenerator](https://github.com/facebook/regenerator) &#8594; [defs](https://github.com/olov/defs)). It would be far better to pass an AST through this process rather than passing strings. This means we probably don't want to hook up this whole pipeline through whatever build system we choose, but wrap it up into a single plugin.

## Gulp + Webpack

[Gulp](http://gulpjs.com/) is a build system built around streams. One thing I like is that it's very simple to use and define new tasks. (Note: I'm going to skip over [grunt](http://gruntjs.com/) because its config syntax is really bad and I just don't like it.)

Gulp supports the N:M file builds in the form of stream events. A plugin can take a single file from a stream and output multiple files. If you add a caching layer with [gulp-cache](https://github.com/wearefractal/gulp-cached), and use the more advanced [gulp-watch](https://github.com/floatdrop/gulp-watch), you could effectively pass in one JS file and have it watch and rebuild all of its dependencies.

I'm not sure a lot of people understand that you can do this, which emits 2 files for every file that comes down the stream:

```js
function explode() {
  return es.through(function(file) {
    this.emit('data', new gutil.File({
      base: file.base,
      cwd: file.cwd,
      path: path.join(file.base, 'foo.js'),
      contents: new Buffer('boo')
    }));

    this.emit('data', file);
  });
}

gulp.task("explode", function() {
  gulp.src('input/main.js')
    .pipe(explode())
    .pipe(gulp.dest('output'));
});
```

Not very many projects use this to help with module bundling, though. There is one project, [amd-optimize](https://github.com/scalableminds/amd-optimize), that does basic dependency tracing for AMD modules. Still, the more sophisticated [gulp-watch](https://github.com/floatdrop/gulp-watch) is needed if you want to watch new files from the stream (you could apply it after `explode()`); it is not builtin. Generally, there is very little mature code that integrates a module bundler into gulp. You have to work at it. So this doesn't really solve our problem of compiling modules for client-side. Everyone just uses browserify or webpack.

Additionally, you really only care about your local dependencies, not ones pulled from npm. You don't need to run your code transformations on npm dependencies. So it's really easy to just give the native watch all of your modules by just doing `gulp.src('src/**/*.js')`. Because of this, and the fact that server-side code doesn't require module bundling, gulp works well for transforming server-side code. This code transforms each file from `src` and generates files in the `build` folder with sourcemaps.

```js
function makeNodeStream(src, withoutSourcemaps) {
  var stream = src.pipe(cache('src'))
      .pipe(sourcemaps.init())
      .pipe(sweetjs({
        readableNames: true,
        modules: ['es6-macros']
      }))
      .pipe(regenerator())
      .pipe(jsheader('var wrapGenerator = require("regenerator/runtime/dev").wrapGenerator;'))
      .pipe(jsheader('require("source-map-support");'));

  if(!withoutSourcemaps) {
    stream = stream.pipe(sourcemaps.write('.'));
  }
  return stream;
}

gulp.task("src", function(cb) {
  es.merge(
    makeNodeStream(gulp.src('src/**/*.js'))
      .pipe(gulp.dest('build')),
    makeNodeStream(gulp.src('static/js/shared/**/*.js'))
      .pipe(gulp.dest('build/shared')),
    gulp.src(['src/**/*', '!src/**/*.js']).pipe(gulp.dest('build'))
  ).on('end', function() {
    nodemon.restart();
    cb();
  });
});
```

An additional complexity is that I have a `shared` folder that also needs to be transformed and output to a different directory. As for as I could tell, I couldn't combine that into a single `gulp.src` and `gulp.dest`, so I created `makeNodeStream` to run it on both. I also copy anything that's not a JS file from src to the build folder. Lastly, when it's finished it restarts the node process using `nodemon`.

My transformation pipeline here goes like this: sweet.js &#8594; regenerator &#8594; header append. I will likely add more steps in the future. This is passing around strings, which I talked about before, when we really should pass around ASTs. One thing I could do is use [esnext](https://github.com/esnext/esnext) instead and integrate sweet.js with it, and then do a single `pipe` to it. It would probably be much faster.

It takes about 2 seconds to compile my whole `src` directory, which is a bunch of code. But who cares? You don't need to recompile everything when just one file changes! Note that I use  the `cache('src')` step first from [gulp-cached](https://github.com/wearefractal/gulp-cached); this will cache all files coming through the stream, and only re-emit files that have changed. That means we only transform new files, and it only takes a few hundred ms now.

### Client-side

What about client-side code? As mentioned before, even though gulp could be used as a module bundler, nobody does that since mature projects like [browserify](http://browserify.org/) and [webpack](http://webpack.github.io/) exist. I chose to use webpack since I like the API and documentation better (and it has more features).

This basically requires me to use CommonJS modules for the browser. This route is well-established in the JS community so I benefit from mature tools. Eventually I'd like to use ES6 modules, but the ecosystem isn't quite there yet. I'm being conservative here so that I don't spend too much time on my tools.

Now that I'm using webpack, all of my problems for client-side development are solved. It has everything, from [code splitting](http://webpack.github.io/docs/code-splitting.html) to [hot module replacement](http://webpack.github.io/docs/hot-module-replacement-with-webpack.html). Here is my webpack config:

```js
var config = {
  cache: true,
  entry: './static/js/main.js',
  output: {
    filename: './static/js/bundle.js'
  },
  resolve: {
    extensions: ['', '.js', '.sjs'],
    fallback: __dirname
  },
  module: {
    loaders: [
      {test: /\.js$/,
       exclude: [/static\/js\/lib\/.*\.js$/,
                 /node_modules\/.*/],
       loader: 'regenerator!sweetjs?modules[]=es6-macros'},
      {test: /\.less$/, loader: "style!css!less"},
      {test: /\.css$/, loader: "style!css"}
    ]
  }
};
```

Webpack is explicitly a module bundler, so all it needs is just one file and it will walk the dependencies. Everything will be bundled together into a single file `bundle.js`. This happens by default, so you can see why this doesn't work for server-side code where we just need a 1:1 file mapping.

This uses a loader on JS files to run them through sweet.js and regenerator. Again, I really should look into [esnext](https://github.com/esnext/esnext) so that I don't keep re-parsing the code.

It also uses some really cool loaders to deal with stylesheets. `less-loader` compiles out [lesscss](http://lesscss.org/). [`css-loader`](https://github.com/webpack/css-loader) is an awesome loader that converts all `@import` and `url` statements to `require` so that everything is resolved the same way, and lets you apply loaders on those resources being loaded, allowing things like inlining the url content straight into the stylesheet. Having everything go through the same mechanism (and able to pull from npm dependencies) is extremely liberating.

To top it all off, [`style-loader`](https://github.com/webpack/style-loader) is a loader that automatically adds a `style` tag to the page when the css file is `require`ed. It also inlines all the CSS into your JavaScript bundle, but you can also make it reference an external CSS file. Either way, all you have to do is `require('css/main.css')` in your JavaScript and it just works.

There are a few other things I do with gulp and webpack, mostly to get integration with a few modules pulled down from npm (like React) working. I also have a `run` task that starts my app and uses [nodemon](https://github.com/remy/nodemon) to track it so it can be restarted whenever a change happens.

View my final setup [on github](https://github.com/jlongster/jlongster-rebuild/).

## Broccoli + ES6 modules

[Broccoli](https://github.com/broccolijs/broccoli) is a rather new build tool that operates on tree structures, so it gets good incremental rebuilds and watches for free. See the [annoucement blog post](http://www.solitr.com/blog/2014/02/broccoli-first-release/) for more details.

I'm not sure if broccoli competes more with gulp or webpack. It sits somewhere in the middle. It doesn't have any concept of tasks, so I can't make a `run` task that restarts my server on changes. But it's also not nearly as specific as webpack, and doesn't dictate anything specific about modules or how things are bundled.

I think broccoli makes it a lot easier to write something *like* webpack, and that's the idea. Basically, in broccoli plugins are always passing around whole trees of files, and a plugin can easily expand a tree into a much bigger tree if needed. This makes it easy to expand dependencies but still leverage the build system to handle them. So watching for changes in dependencies works great, and incremental builds are really fast because it can easily figure out what to do. Webpack has to figure all of this stuff out itself.

I like the idea of broccoli, and because working with modules is easy people are doing a lot of great work to get a workflow for compiling ES6 modules. [This plugin](https://github.com/mmun/broccoli-es6-module-transpiler) integrates [es6-module-transpiler](https://github.com/esnext/es6-module-transpiler) with broccoli and does all the dependency stuff.

The thing broccoli could solve for me is not only using ES6 modules, but also to unify the JS transformation between server-side and client-side. Using gulp and webpack, I have two completely separate processes.

This was my first `Brocfile.js` to see how it would work out:

```js
var pickFiles = require('broccoli-static-compiler');
var sweetjs = require('broccoli-sweetjs');
var transpileES6 = require('broccoli-es6-module-transpiler');

var src = pickFiles('src', {
  srcDir: '/',
  destDir: '/'
});

src = sweetjs(src, {
  modules: ['es6-macros']
});

src = transpileES6(src, { type: 'cjs' });
module.exports = src;
```

Unfortunately, I immediately ran into [a bug](https://github.com/esnext/es6-module-transpiler/issues/146) and it wouldn't compile my code. Somehow I was using an older version that didn't work with nested yields (I guess a newer version needs to be pushed to npm). These kinds of bugs can easily be fixed.

I also ran into a bigger issue though: that project does not have a good story for integration with npm dependencies yet (more discussion [here](https://github.com/esnext/es6-module-transpiler/issues/140#issuecomment-51836103)). With webpack, I could require just `require` dependencies and it would look in `node_modules`, and it worked awesomely. I don't know why we can't do something similar with ES6 modules.

There was also another big issue in general with broccoli: sourcemaps. The sourcemap story for broccoli is very vague (es6-module-transpiler supports them just fine, but I don't know how to expand with sweet.js and pass it the result & sourcemaps and make it combine them). The standard project [broccoli-filter](https://github.com/broccolijs/broccoli-filter) which is supposed to be used by plugins that simply map files 1:1 states right in the README that is does not support sourcemaps. That is insane to me and I can't think about using broccoli until sourcemaps are deeply integrated through and through. Also see [this discussion](https://github.com/joliss/broccoli-sass/pull/19).

In gulp, it's really easy with the awesome [gulp-sourcemaps](https://github.com/floridoo/gulp-sourcemaps) project. You just hook into the stream and write sourcemaps to a directory:

```js
src.pipe('src/**/*.js')
  .pipe(sourcemaps.init())
  .pipe(sweetjs())
  .pipe(regenerator())
  .pipe(sourcemaps.write('.'));
```

Plugins have a standard method of applying sourcemaps. The sourcemap is attached to the `File` instances that are passed through the stream, and combined using [vinyl-sourcemaps-apply](https://github.com/floridoo/vinyl-sourcemaps-apply). It looks like this:

```js
var applySourceMap = require('vinyl-sourcemaps-apply');
// ...
if(myGeneratedSourceMap) {
  applySourceMap(file, myGeneratedSourceMap);
}
```

That incrementally combines sourcemaps as they are applied through the streams. It has worked out really well for me.

**Even without all these problems**, the story in general for browser-side module bundling isn't nearly as strong as browserify or webpack, which have *tons* of features specific for browser modules. So until we get a solid build system that has plugins that implement most of those features of a module bundler, right now using gulp/broccoli + browserify/webpack works pretty darn well.

Most likely, I will switch my project to ES6 modules when can find a good cross-compiler that works well with CommonJS and my current build system.

I could use broccoli and webpack, but at this point I'm just going to stick with gulp. It's easy to use and works really well with server-side transformation and sourcemaps. As for broccoli, I understand the design and I like it, but it does make plugin development very complicated and I'm not entirely sold on it, especially when you can do N:M compilations with gulp. Lastly, it uses temporary files so gulp is potentially faster with streams.

## Stream of Thought EOF

There are several other build systems out there and a million ways to combine them. I can't possibly cover all of them, but I hope this gave some insight into my process for researching. I have something that works well, and the only thing I'll improve in the future is using ES6 modules instead of CJS.

[View the full repo](https://github.com/jlongster/jlongster-rebuild) to see all the glorious code. Specifically, check out the full [gulpfile.js](https://github.com/jlongster/jlongster-rebuild/blob/master/gulpfile.js) and [webpack.config.js](https://github.com/jlongster/jlongster-rebuild/blob/master/webpack.config.js). What's neat about this set up is I can run `webpack` from the CLI like normal, but it's also defined as a task so `gulp webpack` will work and it can be used as a task dependency (for tasks like `gulp all`). I can switch between the systems easily.

I'm sure I have made some errors in this post, as it was mostly stream of thought as I was doing my research. If something is completely off, let me know.

<style type="text/css">.post article > p:first-of-type { font-size: 1em; }</style>
