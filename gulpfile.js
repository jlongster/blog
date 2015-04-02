var fs = require('fs');
var path = require('path');
var gulp = require('gulp');
var gulpif = require('gulp-if');
var rename = require('gulp-rename');
var to5 = require('gulp-6to5');
var gutil = require('gulp-util');
var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var DeepMerge = require('deep-merge');
var nodemon = require('nodemon');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var t = require('transducers.js');
var MemoryFileSystem = require("memory-fs");
var net = require('net');
var BackendHotServer = require('./server/hot-server');

var deepmerge = DeepMerge(function(target, source, key) {
  if(target instanceof Array) {
    return [].concat(target, source);
  }
  return source;
});

// This file is the One Ring. I have created 3 webpack instances
// to build frontend, backend, and bin scripts. This gulpfile gives
// you control over them (see the end of the file for the tasks).
// The backend is built into a single `build/backend.js`, the frontend
// is built into `static/build/frontend.js`, and bin scripts are
// individually compiled into `build/bin/<name>.js`.

// generic config

var defaultConfig = {
  resolve: {
    fallback: __dirname,
    alias: {
      'js-csp': 'build/csp'
    }
  },
  module: {
    loaders: [
      // TODO: add sweet.js macros here
      {test: /\.js$/, exclude: /node_modules/, loaders: ['monkey-hot', '6to5'] },
      {test: /\.json$/, loader: 'json'}
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
else {
  defaultConfig.devtool = '#eval-source-map';
  defaultConfig.debug = true;
}

function config(overrides) {
  return deepmerge(defaultConfig, overrides || {});
}

// output

var outputOptions = {
  cached: false,
  cachedAssets: false,
  exclude: ['node_modules', 'components']
};

function onBuild(err, stats) {
  if(err) {
    throw new Error(err);
  }
  console.log(stats.toString(outputOptions));
}

// frontend

var frontendConfig = config({
  entry: [
    'webpack-dev-server/client?http://localhost:3000',
    'webpack/hot/only-dev-server',
    './static/js/main.js'
  ],
  output: {
    path: path.join(__dirname, 'static/build'),
    // publicPath: '/build/',
    publicPath: 'http://localhost:3000/build/',
    filename: 'frontend.js'
  },
  module: {
    loaders: [
      {test: /\.less$/, loader: 'style!css!less' },
      {test: /\.css$/, loader: 'style!css' }
    ]
  },
  resolve: {
    alias: {
      // TODO: I think some of these can be removed now
      'impl': 'static/js/impl',
      'static': 'static',
      'config.json': 'config/browser.json'
    }
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin({ quiet: true }),
    new webpack.NoErrorsPlugin()
    //new ExtractTextPlugin('styles.css'),
  ],
  profile: true
});
// frontendConfig.module.loaders.unshift(
//   { test: /components\/.*\.js$/, loaders: ['react-hot', '6to5'], exclude: /node_modules/ }
// );

if(process.env.NODE_ENV === 'production') {
  frontendConfig.plugins = frontendConfig.plugins.concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      mangle: {
        except: ['GeneratorFunction', 'GeneratorFunctionPrototype']
      },
      sourceMap: false
    })
  ]);
}

// backend

var node_modules = {};
fs.readdirSync('node_modules')
  .filter(function(x) {
    // Don't make .bin or js-csp external. We manually transform
    // js-csp and alias it into the transformed version.
    return ['.bin', 'js-csp'].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    node_modules[mod] = 'commonjs ' + mod;
  });

var backendConfig = config({
  entry: [
    'webpack/hot/signal.js',
    './server/main.js'
  ],
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
  externals: node_modules,
  recordsPath: path.join(__dirname, 'build/_records'),
  plugins: [
    new webpack.IgnorePlugin(/\.(css|less)$/),
    new webpack.BannerPlugin('require("source-map-support").install();',
                             { raw: true, entryOnly: false }),
    new webpack.HotModuleReplacementPlugin({ quiet: true })
  ],
  devtool: 'sourcemap'
});

if(process.env.NODE_ENV !== 'production') {
  // Disable server rendering in development because it makes build
  // times longer (and makes debugging more predictable)
  backendConfig.plugins.push(
    new webpack.DefinePlugin({
      'process.env.NO_SERVER_RENDERING': true
    })
  );
}

// bin scripts

// Gather all the bin scripts and create an entry point for each one
var bin_modules = t.toObj(fs.readdirSync('bin'), t.compose(
  t.filter(function(x) { return x.indexOf('.js') !== -1; }),
  t.map(function(x) { return [x.replace('.js', ''), path.join('./bin', x)]; })
));
var binConfig = deepmerge(backendConfig, {
  output: {
    path: path.join(__dirname, 'build/bin'),
    filename: 'populate.js'
  },
  node: { __dirname: true }
});
binConfig.entry = bin_modules;

// tasks

gulp.task('transform-modules', function() {
  return gulp.src('node_modules/js-csp/src/**/*.js')
    .pipe(gulpif(/src\/csp.js/, rename('index.js')))
    .pipe(to5())
    .pipe(gulp.dest('build/csp'));
});

gulp.task('backend', function(done) {
  console.log(backendConfig);
  webpack(backendConfig).run(function(err, stats) {
    onBuild(err, stats);
    done();
  });
});

gulp.task('frontend', function(done) {
  webpack(frontendConfig).run(function(err, stats) {
    onBuild(err, stats);
    done();

    fs.writeFileSync('stats.json', JSON.stringify(stats.toJson()));
  });
});

gulp.task('bin', function() {
  webpack(binConfig).run(onBuild);
});

gulp.task('backend-watch', function(done) {
  gutil.log('Backend warming up...');
  var firedDone = false;

  webpack(backendConfig).watch(100, function(err, stats) {
    if(!firedDone) { done(); firedDone = true; }
    //onBuild(err, stats);
    nodemon.restart();
  });
});

gulp.task('frontend-watch', function(done) {
  gutil.log('Frontend warming up...');

  // var firedDone = false;
  // webpack(frontendConfig).watch(100, function(err, stats) {
  //   if(!firedDone) { done(); firedDone = true; }
  //   onBuild(err, stats);
  // });

  done();

  new WebpackDevServer(webpack(frontendConfig), {
    publicPath: frontendConfig.output.publicPath,
    hot: true,
    stats: outputOptions
  }).listen(3000, 'localhost', function (err, result) {
    if(err) {
      console.log(err);
    }
    else {
      console.log('webpack dev server listening at localhost:3000');
    }
  });
});

gulp.task('bin-watch', function(done) {
  done();
  webpack(binConfig).watch(100, onBuild);
});

gulp.task('build', ['backend', 'frontend']);
gulp.task('watch', ['backend-watch', 'frontend-watch']);

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
