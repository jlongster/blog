---
shorturl: "Backend-Apps-with-Webpack--Part-II"
headerimg: ""
tags: ["webpack"]
published: true
date: "March 19, 2015"
abstract: "In <a href=\"http://jlongster.com/Backend-Apps-with-Webpack--Part-I\">Part I</a> of this series, we configured webpack for building backend apps. Now we will look at how to manage frontend and backend code at the same time, and integrating our system with nodemon to restart the server on changes."
---

# Backend Apps with Webpack: Driving with Gulp (Part II)

In [Part I](http://jlongster.com/Backend-Apps-with-Webpack--Part-I) of this series, we configured webpack for building backend apps. With a few simple tweaks, like leaving all dependencies from `node_modules` alone, we can leverage webpack's powerful infrastructure for backend modules and reuse the same system for the frontend. It's a relief to not maintain two separate build systems.

This series is targeted towards people already using webpack for the frontend. You may find [babel's require hook](http://babeljs.io/docs/using-babel/#require-hook) fine for the backend, which is great. You might want to run files through multiple loaders, however, or share code between frontend and backend. Most importantly, you want to use [hot module replacement](http://webpack.github.io/docs/hot-module-replacement.html). This is an experiment to reuse webpack for all of that.

In this post we are going to look at more fine-grained control over webpack, and how to manage both frontend and backend code at the same time. We are going to use gulp to drive webpack. This should be a usable setup for a real app.

Some of the responses to [Part I](http://jlongster.com/Backend-Apps-with-Webpack--Part-I) criticized webpack as too complicated and not standards-compliant, and we should be moving to [jspm](http://jlongster.com/Backend-Apps-with-Webpack--Part-I) and [SystemJS](https://github.com/systemjs/systemjs). SystemJS is a runtime module loaded based on the ES6 specification. The people behind jspm are doing fantastic work, but all I can say is that they don't have many features that webpack users love. A simple example is [hot module replacement](http://webpack.github.io/docs/hot-module-replacement.html). I'm sure in the years to come something like webpack will emerge based on the loader specification, and I'll gladly switch to it.

The most important thing is that we start writing ES6 modules. This affects the community a whole lot more than loaders, and luckily it's very simple to do with webpack. You need to use a compiler like [Babel](http://babeljs.io/) that supports modules, which you really want to do anyway to get all the good ES6 features. These compilers will turn ES6 modules into `require` statements, which can be processed with webpack.

I converted the [backend-with-webpack](https://github.com/jlongster/backend-with-webpack/tree/part1-es6) repo to use the Babel loader and ES6 modules in the `part1-es6` branch, and I will continue to use ES6 modules from here on.

## Gulp

[Gulp](http://gulpjs.com/) is nice task runner that makes it simple to automate anything. Even though we aren't using it to transform or bundle modules, its still useful as a "master controller" to drive webpack, test runners, and anything else you might need to do.

If you are going to use webpack for both frontend and backend code, you will need two separate configuration files. You could manually specify the desired config with `--config`, and run two separate watchers, but that gets redundant quickly. It's annoying to have two separate processes in two different terminals.

Webpack actually supports multiple configurations. Instead of exporting a single one, you export an array of them and it will run multiple processes for you. I still prefer using gulp instead because you might not want to always run both at the same time.

We need to convert our webpack usage to use the API instead of the CLI, and make a gulp task for it. Let's start by converting our [existing config file](https://github.com/jlongster/backend-with-webpack/blob/part1-es6/webpack.config.js) into a gulp task.

The only difference is instead of exporting the config, you pass it to the webpack API. The gulpfile will look like this:

```js
var gulp = require('gulp');
var webpack = require('webpack');

var config = {
  ...
};

gulp.task('build-backend', function(done) {
  webpack(config).run(function(err, stats) {
    if(err) {
      console.log('Error', err);
    }
    else {
      console.log(stats.toString());
    }
    done();
  });
});
```

You can pass a config to the `webpack` function and you get back a compiler. You can call `run` or `watch` on the compiler, so if you wanted to make a `build-watch` task which automatically recompiles modules on change, you would call `watch` instead of `run`.

Our gulpfile is getting too big to show all of it here, but you can [check out](https://github.com/jlongster/backend-with-webpack/blob/part2a/gulpfile.js) the new `gulpfile.js` which is a straight conversion of our old `webpack.config.js`. Note that we added a [babel](http://babeljs.io/) loader so we can write ES6 module syntax.

## Multiple Webpack Configs

Now we're ready to roll! We can create another task for building frontend code, and simply provide a different webpack configuration. But we don't want to manage two completely separate configurations, since there are common properties between them.

What I like to do is create a base config and have others extend from it. Let's start with this:

```js
var DeepMerge = require('deep-merge');

var deepmerge = DeepMerge(function(target, source, key) {
  if(target instanceof Array) {
    return [].concat(target, source);
  }
  return source;
});

// generic

var defaultConfig = {
  module: {
    loaders: [
      {test: /\.js$/, exclude: /node_modules/, loaders: ['babel'] },
    ]
  }
};

if(process.env.NODE_ENV !== 'production') {
  defaultConfig.devtool = 'source-map';
  defaultConfig.debug = true;
}

function config(overrides) {
  return deepmerge(defaultConfig, overrides || {});
}
```

We create a deep merging function for recursively merging objects, which allows us to override the default config, and we provide a function `config` for generating configs based off of it.

Note that you can turn on production mode by running the gulp task with `NODE_ENV=production` prefixed to it. If so, sourcemaps are not generated and you could add plugins for minifying code.

Now we can create a frontend config:

```js
var frontendConfig = config({
  entry: './static/js/main.js',
  output: {
    path: path.join(__dirname, 'static/build'),
    filename: 'frontend.js'
  }
});
```

This makes `static/js/main.js` the entry point and bundles everything together at `static/build/frontend.js`.

Our backend config uses the same technique: customizing the config to be backend-specific. I don't think it's worth pasting here, but you can [look at it](https://github.com/jlongster/backend-with-webpack/blob/part2b/gulpfile.js#L55) on github. Now we have two tasks:

```js
function onBuild(done) {
  return function(err, stats) {
    if(err) {
      console.log('Error', err);
    }
    else {
      console.log(stats.toString());
    }
    
    if(done) {
	  done();
    }
  }
}

gulp.task('frontend-build', function(done) {
  webpack(frontendConfig).run(onBuild(done));
});

gulp.task('backend-build', function(done) {
  webpack(backendConfig).run(onBuild(done));
});
```

In fact, you could go crazy and provide several different interactions:

```js
gulp.task('frontend-build', function(done) {
  webpack(frontendConfig).run(onBuild(done));
});

gulp.task('frontend-watch', function() {
  webpack(frontendConfig).watch(100, onBuild());
});

gulp.task('backend-build', function(done) {
  webpack(backendConfig).run(onBuild(done));
});

gulp.task('backend-watch', function() {
  webpack(backendConfig).watch(100, onBuild());
});

gulp.task('build', ['frontend-build', 'backend-build']);
gulp.task('watch', ['frontend-watch', 'backend-watch']);
```

`watch` takes a delay as the first argument, so any changes within 100ms will only fire one rebuild.

You would typically run `gulp watch` to watch the entire codebase for changes, but you could just build or watch a specific piece if you wanted.

## Nodemon

[Nodemon](http://nodemon.io/) is a nice process management tool for development. It starts a process for you and provides APIs to restart it. The goal of nodemon is to watch file changes and restart automatically, but we are only interested in manual restarts.

After installing with `npm install nodemon` and adding `var nodemon = require('nodemon')` to the top of the gulpfile, we can create a `run` task which executes the compiled backend file:

```js
gulp.task('run', ['backend-watch', 'frontend-watch'], function() {
  nodemon({
    execMap: {
      js: 'node'
    },
    script: path.join(__dirname, 'build/backend'),
    ignore: ['*'],
    watch: ['foo/'],
    ext: 'noop'
  }).on('restart', function() {
    console.log('Restarted!');
  });
});
```

This task also specifies dependencies on the `backend-watch` and `frontend-watch` tasks, so the watchers are automatically fired up and will code will recompile on change.

The `execMap` and `script` options specify how to actually run the program. The rest of the options are for nodemon's watcher, and we actually don't want it to watch anything. That's why `ignore` is `*`, `watch` is a non-existant directory, and `ext` is a non-existant file extension. Initially I only used the `ext` option but I ran into performance problems because nodemon still was watching *everything* in my project.

So how does our program actually restart on change? Calling `nodemon.restart()` does the trick, and we can do this within the `backend-watch` task:

```js
gulp.task('backend-watch', function() {
  webpack(backendConfig).watch(100, function(err, stats) {
    onBuild()(err, stats);
    nodemon.restart();
  });
});
```

Now, when running `backend-watch`, if you change a file it will be rebuilt and the process will automatically restart.

Our gulpfile is complete. After all this work, you just need to run this to start everything:

```
gulp run
```

As you code, everything will automatically be rebuilt and the server will restart. Hooray!

## A Few Tips

### Better Performance

If you are using sourcemaps, you will notice compilation performance degrades the more files you have, even with incremental compilation (using watchers). This happens because webpack has to regenerate the entire sourcemap of the generated file even if a single module changes. This can be fixed by changing the `devtool` from `source-map` to `#eval-source-map`:

```js
config.devtool = '#eval-source-map';
```

This tells webpack to process source-maps individually for each module, which it achieves by `eval`-ing each module at runtime with its own sourcemap. Prefixing it with `#` tells it you use the `//#` comment instead of the older `//@` style.

### Node Variables

I mentioned this in [Part I](http://jlongster.com/Backend-Apps-with-Webpack--Part-I), but some people missed it. Node defines variables like `__dirname` which are different for each module. This is a downside to using webpack, because we no longer have the node context for these variables, and webpack needs to fill them in.

Webpack has a workable solution, though. You can tell it how to treat these variables with the [node configuration entry](http://webpack.github.io/docs/configuration.html#node). You most likely want to set `__dirname` and `__filename` to `true` which will keep its real values. They default to `"mock"` which gives them dummy values (meant for browser environments).

## Until Next Time

Our setup is now capable of building a large, complex app. If you want to share code between the frontend and backend, its easy to do since both sides use the same infrastructure. We get the same incremental compilation on both sides, and with the `#eval-source-map` setting, even with large amount of files modules are rebuilt in under 200ms.

I encourage you to modify this gulpfile to your heart's content. The great thing about webpack and gulp and is that its easy to customize it to your needs, so go wild.

These posts have been building towards the final act. We are now ready to take advantage of the most significant gain of this infrastructure: [hot module replacement](http://webpack.github.io/docs/hot-module-replacement.html). React users have enjoyed this via [react-hot-loader](http://gaearon.github.io/react-hot-loader/), and now that we have access to it on the backend, we can live edit backend apps. Part III will show you how to do this.

*Thanks to [Dan Abramov](http://twitter.com/dan_abramov) for reviewing this post.*

