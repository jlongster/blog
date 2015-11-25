var fs = require('fs');
var path = require('path');
var gulp = require('gulp');
var gulpif = require('gulp-if');
var rename = require('gulp-rename');
var gulpBabel = require('gulp-babel');
var gutil = require('gulp-util');
var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var DeepMerge = require('deep-merge');
var nodemon = require('nodemon');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var t = require('transducers.js');

var PROD = process.env.NODE_ENV === 'production';

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

var babelLoader = 'babel?optional=runtime&stage=1';

var defaultConfig = {
  resolve: {
    alias: {
      'js-csp': path.join(__dirname, 'src/lib/csp'),
      'static': path.join(__dirname, 'static')
    }
  },
  plugins: []
};

if(PROD) {
  defaultConfig.plugins = defaultConfig.plugins.concat([
    new webpack.optimize.OccurenceOrderPlugin()
  ]);
}
else {
  //defaultConfig.devtool = '#eval-source-map';
  defaultConfig.devtool = '#source-map';
  //defaultConfig.devtool = 'eval';
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
    './static/js/main.js'
  ],
  output: {
    path: path.join(__dirname, 'static/build'),
    publicPath: PROD ? '/build/' : 'http://localhost:3000/static/build/',
    filename: 'frontend.js'
  },
  module: {
    loaders: [
      {test: /\.js$/,
       exclude: /node_modules/,
       loaders: PROD ? [babelLoader] : ['react-hot', babelLoader] },
      {test: /\.less$/,
       loader: (PROD ?
                ExtractTextPlugin.extract('style-loader', 'css!less') :
                'style!css!less') },
      {test: /\.css$/,
       loader: (PROD ?
                ExtractTextPlugin.extract('style-loader', 'css') :
                'style!css') }
    ]
  },
  resolve: {
    alias: {
      'impl': path.join(__dirname, 'static/js/impl'),
    }
  }
});

if(!PROD) {
  frontendConfig.entry = [
    'webpack-dev-server/client?http://localhost:3000',
    'webpack/hot/only-dev-server'
  ].concat(frontendConfig.entry);

  frontendConfig.plugins = frontendConfig.plugins.concat([
    new webpack.HotModuleReplacementPlugin({ quiet: true }),
    new webpack.NoErrorsPlugin()
  ]);
}
else {
  frontendConfig.plugins = frontendConfig.plugins.concat([
    new ExtractTextPlugin('styles.css'),
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

node_modules['react/addons'] = 'commonjs react/addons';

var backendConfig = config({
  entry: ['./server/main.js'],
  target: 'node',
  module: {
    loaders: [
      {test: /\.js$/,
       exclude: /node_modules/,
       loaders: [babelLoader] }
    ]
  },
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
      'impl': path.join(__dirname, 'server/impl')
    },
  },
  externals: node_modules,
  recordsPath: path.join(__dirname, 'build/_records'),
  plugins: [
    new webpack.IgnorePlugin(/\.(css|less)$/),
    new webpack.BannerPlugin('require("source-map-support").install();',
                             { raw: true, entryOnly: false })
  ],
  devtool: 'sourcemap'
});

if(!PROD) {
  // backendConfig.entry.unshift('webpack/hot/signal.js');

  // Disable server rendering in development because it makes build
  // times longer (and makes debugging more predictable).
  // And add Hot Module Replacement functionality
  backendConfig.plugins = backendConfig.plugins.concat([
    // new webpack.DefinePlugin({
    //   'process.env.NO_SERVER_RENDERING': true
    // })
    // new webpack.HotModuleReplacementPlugin({ quiet: true }),
    // new webpack.NoErrorsPlugin()
  ]);
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
    .pipe(gulpBabel())
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

  if(PROD) {
    var firedDone = false;
    webpack(frontendConfig).watch(100, function(err, stats) {
      if(!firedDone) { done(); firedDone = true; }
      onBuild(err, stats);
    });
  }
  else {
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
  }
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
