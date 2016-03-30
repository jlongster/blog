---
shorturl: "Backend-Apps-with-Webpack--Part-I"
headerimg: ""
tags: ["webpack"]
published: true
date: "March 16, 2015"
abstract: "Webpack is an amazing tool. This is the first post in a series about how to use it for backend apps as well as frontend. Using the exact same build process for both is amazing."
---

# Backend Apps with Webpack (Part I)

[Webpack](http://webpack.github.io/) is an amazing tool. It calls itself a "module bundler" but it is much more than that: it provides an infrastructure for building, transforming, and live updating modules. While its [wall of configuration options](http://webpack.github.io/docs/configuration.html) may not be your style, this approach works really well for the problem it's solving.

In fact, the style of its documentation and APIs are not my favorite, but it all comes together as a really powerful (and sorely needed) tool. All other tools treat modules as basically chunks of code wrapped in different scopes. Modules are way more than that, and webpack is a tool that *finally* provides a powerful infrastructure for dealing with them.

For example, [hot module replacement](http://webpack.github.io/docs/hot-module-replacement.html) allows you to change a module and update the existing instance live. This is the juice within [react-hot-loader](http://gaearon.github.io/react-hot-loader/) and this is the kind of stuff we need to be building. You'll never look back after experiencing this. (Lispers were right all along!)

Since browsers do not natively have JavaScript modules yet, and you want to deliver modules by bundling them together into a single (or a few) files, tools like webpack are commonly marketed as frontend build tools. But note that nothing I said above is frontend-specific. Why would a powerful module-based build tool be frontend specific?

After using webpack for the the frontend, you realize that you *really* want it for the backend (node or io.js) too.

Node and io.js *do* have native modules. The problem is that they have no infrastructure for doing anything with them. Projects like [gulp](http://gulpjs.com/) try to fill this gap, but since they aren't module-based they only help with simple tasks like transforming files. [Broccoli](https://github.com/broccolijs/broccoli) is a build tool that understands the importance of dealing with trees instead of files, but because they don't explicitly embrace modules it's still too much work to do anything.

Besides, do you really want to maintain two completely separate build tools when they are solving the same problem? I've done this (I had a gulp setup), and it feels hilariously redundant.

**There's no reason not to use webpack** for node/io.js code, and let me tell you, it's amazing. I'm going to show you, in a few posts, how to do it. This is part one.

## Getting Started

If you don't know anything about webpack, you specify your configuration in `webpack.config.js` and then run `webpack` at the command line. You rarely need to give `webpack` any options; you can do everything you want in the configuration file. I'm going to assume you are at least somewhat familiar with how webpack works.

Webpack takes an entry module, reads the entire dependency tree, and bundles it all together as a single file (assuming a simple configuration). We are going to do this for the backend as well. Let's start with this simple config, which tells it to take the entry point `src/main.js` and generate a file at `build/backend.js`.

```js
var path = require('path');

module.exports = {
  entry: './src/main.js',
  target: 'node',
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'backend.js'
  }
}
```

The `target: 'node'` option tells webpack not to touch any built-in modules like `fs` or `path`.

But there is a problem. Webpack will load modules from the `node_modules` folder and bundle them in. This is fine for frontend code, but backend modules typically aren't prepared for this (i.e. using `require` in weird ways) or even worse are binary dependencies. We simply don't want to bundle in anything from `node_modules`.

I wrote a small simple app so that you can try this out yourself: [backend-with-webpack](https://github.com/jlongster/backend-with-webpack/tree/part1). In [`main.js`](https://github.com/jlongster/backend-with-webpack/blob/part1/src/main.js), the entry point, it loads express and starts a server. If you try the above webpack configuration, you'll see this warning:

```
WARNING in ./~/express/lib/view.js
Critical dependencies:
50:48-69 the request of a dependency is an expression
 @ ./~/express/lib/view.js 50:48-69
```

I'm sure we could get express to fix this, but the major problem is binary dependencies. The simple thing to do is not to bundle `node_modules`. We can solve this using webpack's `externals` configuration option. A module listed as an external will simply be left alone; it will not be bundled in.

We just need to read the list of directories inside `node_modules` and give to `externals`.

Unfortunately the default behavior of `externals` is not what we want. It assumes a browser environment, so `require("foo")` is turned into just `foo`, a global variable. We want to keep the `require`. This is possible by creating an object with a key/value of each module name, and prefixing the value with "commonjs". The entire configuration is now this:

```js
var webpack = require('webpack');
var path = require('path');
var fs = require('fs');

var nodeModules = {};
fs.readdirSync('node_modules')
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

module.exports = {
  entry: './src/main.js',
  target: 'node',
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'backend.js'
  },
  externals: nodeModules
}
```

If you build my `backend-with-webpack` project with the above config, and look in the generated file `build/backend.js`, you'll see the dependencies from `node_modules` left alone:

```js
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = require("transducers.js");

/***/ }
```

That's it! Now you can enjoy webpack for the backend too, using the exact same loaders and transformers you use for frontend code. If you want to recompile the code whenever a file changes, run the watcher:

```
webpack --watch
```

## Sourcemaps, CSS, and Other Tweaks

One crucial piece is missing: sourcemaps. Whenever you compile JavaScript, sourcemaps are necessary to stay sane. This is not a side effect of our webpack usage; even if you use [babel](http://babeljs.io/) to compile your backend code with gulp, you need sourcemaps.

Luckily, webpack supports sourcemaps very nicely. If you add the option `devtool: 'sourcemap'` to your config, webpack will generate a sourcemap. For backend apps, you also want to use [source-map-support](https://www.npmjs.com/package/source-map-support) which automatically sourcemaps stack traces from node/io.js. We need to install it at the top of the generated file, and we can use the `BannerPlugin` to do this. You can add plugins by giving an array to `plugins`:

```js
plugins: [
  new webpack.BannerPlugin('require("source-map-support").install();',
                           { raw: true, entryOnly: false })
],
```

`raw: true` tells webpack to prepend the text as it is, not wrapping it in a comment. `entryOnly: false` adds the text to all generated files, which you might have multiple if using [code splitting](http://webpack.github.io/docs/code-splitting.html).

Let's try it. If I add `foo()` on [line 9 of main.js](https://github.com/jlongster/backend-with-webpack/blob/part1/src/main.js#L9), run `webpack` and then `node build/backend.js`, we get the following error:

```
...snip.../backend-with-webpack/build/webpack:/src/main.js:9
foo();
^
ReferenceError: foo is not defined
    at Object.<anonymous> (...snip.../webpack:/src/main.js:9:1)
```

The filename and line number are correct!

If you are running code both the server and client, its common to include CSS files for the client. For the backend, we want to just ignore these dependencies. We can do this with the `IgnorePlugin`:

```
new webpack.IgnorePlugin(/\.(css|less)$/)
```

This will ignore all files with the `css` or `less` extension.

**Edit**: Actually, the above only works when you only use code splitting to pull in CSS, like in the `componentDidMount` method. The `IgnorePlugin` will simply avoid generating that extra chunk, but doesn't help when you want to actually tell the server-side to ignore a top-level require (you will get a "module not found" error at run-time). To do that, use `new NormalModuleReplacementPlugin(/\.css$/, 'node-noop')`, an idea from [Dustan Kasten](https://twitter.com/iamdustan/status/577561601353465856).

Lastly, you can configure how webpack deals with variables like `process`, `__dirname`, and `__filename` with the [node configuration option](http://webpack.github.io/docs/configuration.html#node).

Ok! Our final working configuration file is the following:

```js
var webpack = require('webpack');
var path = require('path');
var fs = require('fs');

var nodeModules = {};
fs.readdirSync('node_modules')
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

module.exports = {
  entry: './src/main.js',
  target: 'node',
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'backend.js'
  },
  externals: nodeModules,
  plugins: [
    new webpack.IgnorePlugin(/\.(css|less)$/),
    new webpack.BannerPlugin('require("source-map-support").install();',
                             { raw: true, entryOnly: false })
  ],
  devtool: 'sourcemap'
}
```

## Go Forth and Webpack

That wasn't hard, was it? Aren't you excited about getting rid of all that duplicate code for building the backend?

We are still missing some nice things. In the next post, I will show you how to manage multiple webpack instances with gulp so you can handle backend and frontend code at the same time with different configurations. I will also show how to automatically restart the server when a build happens.






