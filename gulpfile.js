var fs = require('fs');
var path = require('path');
var gulp = require('gulp');
var gulpif = require('gulp-if');
var rename = require('gulp-rename');
var to5 = require('gulp-6to5');
var gutil = require('gulp-util');
var webpack = require('webpack');
var DeepMerge = require('deep-merge');
var nodemon = require('nodemon');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var t = require('transducers.js');

var deepmerge = DeepMerge(function(target, source, key) {
  if(target instanceof Array) {
    return [].concat(target, source);
  }
  return source;
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
  defaultConfig.devtool = 'sourcemap';
  defaultConfig.debug = true;
}

function config(overrides) {
  return deepmerge(defaultConfig, overrides || {});
}

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
  entry: './static/js/main.js',
  output: {
    path: path.join(__dirname, 'static/build'),
    publicPath: '/build/',
    filename: 'frontend.js'
  },
  module: {
    loaders: [
      {test: /\.less$/, loader: ExtractTextPlugin.extract('style-loader', 'css!less') },
      {test: /\.css$/, loader: ExtractTextPlugin.extract('style-loader', 'css') }
    ]
  },
  resolve: {
    alias: {
      'impl': 'static/js/impl',
      'static': 'static',
      'config.json': 'config/browser.json'
    }
  },
  plugins: [new ExtractTextPlugin('styles.css')]
});

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
      }
    })
  ]);
}

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
    new webpack.IgnorePlugin(/\.(css|less)$/),
    new webpack.BannerPlugin('require("source-map-support").install();',
                             { raw: true, entryOnly: false }),
  ],
  devtool: 'sourcemap'
});

// if(process.env.NODE_ENV !== 'production') {
//   // Disable server rendering in development because it makes build
//   // times longer (and makes debugging more predictable)
//   backendConfig.plugins.push(
//     new webpack.DefinePlugin({
//       'process.env.NO_SERVER_RENDERING': true
//     })
//   );
// }

// bin scripts

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
  webpack(backendConfig).run(function(err, stats) {
    onBuild(err, stats);
    done();
  });
});

gulp.task('frontend', function(done) {
  webpack(frontendConfig).run(function(err, stats) {
    onBuild(err, stats);
    done();
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
    onBuild(err, stats);
    nodemon.restart();
  });
});

gulp.task('frontend-watch', function(done) {
  gutil.log('Frontend warming up...');
  var firedDone = false;
  webpack(frontendConfig).watch(100, function(err, stats) {
    if(!firedDone) { done(); firedDone = true; }
    onBuild(err, stats);
  });
});

gulp.task('bin-watch', function(done) {
  done();
  webpack(binConfig).watch(100, onBuild);
});

gulp.task('build', ['backend', 'frontend']);
gulp.task('watch', ['backend-watch', 'frontend-watch']);

gulp.task('run', function() {
  nodemon({
    execMap: {
      js: 'node'
    },
    ignore: ['*'],
    watch: ['bin/'],
    script: path.join(__dirname, 'build/backend'),
    ext: 'noop',
    env: process.env
  }).on('restart', function() {
    console.log('restarted!');
  });
});

gulp.task('run-watch', ['watch', 'run']);
