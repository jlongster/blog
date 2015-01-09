var os = require('os');
var path = require('path');
var gulp = require('gulp');
var to5 = require('gulp-6to5');
var es = require('event-stream');
var nodemon = require('nodemon');
var gulpif = require('gulp-if');
var rename = require('gulp-rename');
var header = require('gulp-header');
var sourcemaps = require('gulp-sourcemaps');
var cache = require('gulp-cached');
var ignore = require('gulp-ignore');

var paths = {
  src: ['server/**/*.js', 'src/**/*.js', 'tests/**/*.js'],
  build: '.built'
};

function jsprefix(text, contents) {
  // This unconditionally adds the text at the end of the first line,
  // so the first line must be a complete statement (or blank). If we
  // added a new line it would mess up the line numbers.
  var lines = contents.split('\n');
  return lines[0] + ' ' + text + '\n' + lines.slice(1).join('\n');
}

function jsheader(text) {
  return es.through(function(file) {
    if(file.contents) {
      file.contents = new Buffer(
        jsprefix(text, file.contents.toString('utf8'))
      );
    }
    this.emit('data', file);
  });
}

gulp.task("regenerate", function(done) {
  return gulp.src('node_modules/js-csp/src/**/*.js')
    .pipe(gulpif(/src\/csp.js/, rename('index.js')))
    .pipe(to5())
    .pipe(gulp.dest('src/lib/csp'));
});

gulp.task('6to5', function() {
  var stream = gulp.src(paths.src)
      .pipe(cache('6to5'))
      .pipe(sourcemaps.init())
      .pipe(to5())
      .pipe(jsheader('var wrapGenerator = require("regenerator/runtime").wrapGenerator;'));

  if(process.env.NODE_ENV !== 'production') {
    stream = stream.pipe(jsheader("require('source-map-support').install();"))
      .pipe(sourcemaps.write('.'));
  }

  return stream.pipe(es.through(function(file) {
    var dir = file.path.slice(file.cwd.length);
    if(dir.match(/^\/src/) || dir.match(/^\/tests/)) {
      file.base = file.cwd;
    }
    this.emit('data', file);
  })).pipe(gulp.dest(paths.build));
});

gulp.task("bin", function() {
  gulp.src('bin/**/*.js')
    .pipe(to5())
    .pipe(jsheader("require('source-map-support').install();"))
    .pipe(jsheader('var wrapGenerator = require("regenerator/runtime").wrapGenerator;'))
    .pipe(header('#!/usr/bin/env node\n'))
    .pipe(rename(function(path) {
      if(path.extname == '.js') {
        path.extname = '';
      }
    }))
    .pipe(gulp.dest('bin'));
});

gulp.task('rebuild', gulp.series('regenerate', '6to5'));

gulp.task('run', gulp.series('6to5', function() {
  process.env['NODE_PATH'] = (process.env['NODE_PATH'] + ':' +
                              // Add the base directory so everything
                              // can access `src` and `impl` dir as top-level
                              path.join(__dirname, paths.build));

  gulp.watch(paths.src, gulp.series('6to5', function() {
    nodemon.restart();
  }));

  nodemon({
    execMap: {
      js: 'node --harmony'
    },
    script: path.join(paths.build, 'main'),
    ext: 'noop'
  }).on('restart', function() {
    console.log('restarted!');
  });
}));
