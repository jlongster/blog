var path = require('path');
var fs = require('fs');
var gulp = require('gulp');
var gulpif = require('gulp-if');
var rename = require('gulp-rename');
var to5 = require('gulp-6to5');
var webpack = require('webpack');
var gutil = require('gulp-util');
var DeepMerge = require('deep-merge');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var nodemon = require('nodemon');
var t = require('transducers.js');

var deepmerge = DeepMerge(function(target, source, key) {
  return [].concat(target, source);
});

// generic config

var defaultConfig = {
  cache: true,
  resolve: {
    fallback: __dirname,
    alias: {
      'js-csp': 'build/csp'
    }
  },
  module: {
    loaders: [
      {test: /\.js$/, exclude: /node_modules/, loader: '6to5'},
      {test: /\.json$/, loader: "json"}
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      regeneratorRuntime: 'static/js/regenerator-runtime.js'
    })
  ]
};

if(process.env.NODE_ENV === 'production') {
  defaultConfig.plugins = defaultConfig.plugins.concat([
    new webpack.optimize.OccurenceOrderPlugin()
  ]);
}

function config(overrides, isFrontend) {
  var c = deepmerge(defaultConfig, overrides || {});

  if(isFrontend) {
    c = deepmerge(c, {
      module: {
        loaders: [
          {test: /\.less$/, loader: ExtractTextPlugin.extract("style-loader", "css!less") },
          {test: /\.css$/, loader: ExtractTextPlugin.extract("style-loader", "css") }
        ]
      },
      plugins: [new ExtractTextPlugin('styles.css')]
    });

    if(process.env.NODE_ENV === 'production') {
      c = deepmerge({
        plugins: [
          new webpack.DefinePlugin({
            "process.env": {
              NODE_ENV: JSON.stringify("production")
            }
          }),
          new webpack.optimize.DedupePlugin(),
          new webpack.optimize.UglifyJsPlugin({
            mangle: {
              except: ['GeneratorFunction', 'GeneratorFunctionPrototype']
            }
          })
        ]
      });
    }
    else {
      c.devtool = 'sourcemap';
      c.debug = true;

    }
  }
  else {
    c.devtool = 'sourcemap';
    c.debug = true;
  }

  return c;
}

// frontend

var frontendConfig = config({
  entry: './static/js/main.js',
  output: {
    path: path.join(__dirname, 'build/static'),
    publicPath: '/static/',
    filename: 'frontend.js'
  },
  resolve: {
    alias: {
      'impl': 'static/js/impl',
      'static': 'static',
      'config.json': 'config/browser.json'
    }
  }
}, true);

// backend

var blacklist = ['.bin', 'js-csp'];
var node_modules = fs.readdirSync('node_modules').filter(
  function(x) { return blacklist.indexOf(x) === -1; }
);
var backendConfig = config({
  entry: './server/main.js',
  target: 'node',
  node: {
    __filename: true,
    __dirname: false
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'backend.js'
  },
  resolve: {
    alias: {
      'impl': 'server/impl'
    },
  },
  externals: function(context, request, cb) {
    if(node_modules.indexOf(request) !== -1) {
      cb(null, 'commonjs ' + request);
      return;
    }
    cb();
  },
  plugins: [
    new webpack.IgnorePlugin(/\.(css|less)$/)
  ]
});

if(process.env.NODE_ENV !== 'production') {
  backendConfig.plugins.unshift(
    new webpack.BannerPlugin('require("source-map-support").install();',
                             { raw: true, entryOnly: false })
  )
}

// bin scripts

var bin_modules = t.toObj(fs.readdirSync('bin'), t.compose(
  t.filter(function(x) { return x.indexOf('.js') !== -1; }),
  t.map(function(x) { return [x.replace('.js', ''), path.join('./bin', x)]; })
));
var binConfig = deepmerge(backendConfig, {});
binConfig.entry = bin_modules;
binConfig.output = {
  path: path.join(__dirname, 'build/bin'),
  filename: 'populate.js'
};
binConfig.node.__dirname = true;

// output

var outputOptions = {
  cached: false,
  cachedAssets: false,
  context: process.cwd(),
  json: false,
  colors: true,
  modules: true,
  chunks: false,
  reasons: false,
  errorDetails: false,
  chunkOrigins: false,
  exclude: ["node_modules", "components"]
};

function onBuild(err, stats) {
  if(err) {
    throw new gutil.PluginError("webpack", err);
  }
  gutil.log(stats.toString(outputOptions));
}

// tasks

gulp.task("transform-modules", function() {
  return gulp.src('node_modules/js-csp/src/**/*.js')
    .pipe(gulpif(/src\/csp.js/, rename('index.js')))
    .pipe(to5())
    .pipe(gulp.dest('build/csp'));
});

gulp.task("bin", function(done) {
  webpack(binConfig, function(err, stats) {
    onBuild(err, stats);
    done();
  });
});

gulp.task("bin-run", function() {
  webpack(binConfig).watch(100, onBuild);
});

gulp.task("frontend", function(done) {
  webpack(frontendConfig, function(err, stats) {
    onBuild(err, stats);
    done();
  });
});

gulp.task("frontend-run", function() {
  webpack(frontendConfig).watch(100, onBuild);
});

gulp.task("backend", function(done) {
  webpack(backendConfig, function(err, stats) {
    onBuild(err, stats);
    done();
  });
});

gulp.task("backend-run", ["nodemon"], function(done) {
  done();
  gutil.log('Backend warming up');

  webpack(backendConfig).watch(100, function(err, stats) {
    onBuild(err, stats);
    nodemon.restart();
  });
});

gulp.task("nodemon", function() {
  nodemon({
    execMap: {
      js: 'node'
    },
    script: path.join(__dirname, 'build/backend'),
    ext: 'noop'
  }).on('restart', function() {
    console.log('restarted!');
  });
});

gulp.task("build", function(done) {
  webpack([frontendConfig, backendConfig], function(err, stats) {
    onBuild(err, stats);
    done();
  });
});

gulp.task("run", ["nodemon"], function(done) {
  done();
  gutil.log('Frontend & backend warming up');
  webpack([frontendConfig, backendConfig]).watch(100, function(err, stats) {
    onBuild(err, stats);
    nodemon.restart();
  });
});
