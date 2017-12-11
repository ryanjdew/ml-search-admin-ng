/*jshint node: true */

'use strict';

var gulp = require('gulp'),
    concat = require('gulp-concat'),
    html2Js = require('gulp-ng-html2js'),
    jshint = require('gulp-jshint'),
    Server = require('karma').Server,
    minifyHtml = require('gulp-minify-html'),
    path = require('path'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    rm = require('gulp-rm'),
    ghpages = require('gulp-gh-pages'),
    cp = require('child_process');

gulp.task('jshint', function() {
  gulp.src([
      './gulpfile.js',
      './src/**/*.js'
    ])
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('scripts', ['test'], function() {
  return gulp.src([
      './src/mlSearchAdmin.module.js',
      './src/**/*.js'
    ])
    .pipe(concat('mlSearchAdmin.js'))
    .pipe(gulp.dest('dist'))
    .pipe(rename('mlSearchAdmin.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist'));
});

gulp.task('templates', ['test'], function() {
  return gulp.src([ './src/**/*.html' ])
    .pipe(minifyHtml({
        empty: true,
        spare: true,
        quotes: true
    }))
    .pipe(html2Js({
      moduleName: 'ml.searchAdmin.tpls',
      prefix: '/ml-search-admin/'
    }))
    .pipe(concat('ml-search-admin-ng-tpls.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist'));
});

gulp.task('test', function() {
  new Server({
    configFile: path.join(__dirname, './karma.conf.js'),
    singleRun: true,
    autoWatch: false
  }, function (exitCode) {
    console.log('Karma has exited with ' + exitCode);
    process.exit(exitCode);
  }).start();
});

gulp.task('autotest', function() {
  new Server({
    configFile: path.join(__dirname, './karma.conf.js'),
    autoWatch: true
  }, function (exitCode) {
    console.log('Karma has exited with ' + exitCode);
    process.exit(exitCode);
  }).start();
});

gulp.task('docs', function() {
  cp.exec('./node_modules/.bin/jsdoc -c jsdoc.conf.json', function(err) {
    if (err) {
      return console.log(err);
    }

    gulp.src([ './docs/generated/css/baseline.css', './docs/custom-styles.css' ])
    .pipe(concat('baseline.css'))
    .pipe(gulp.dest('./docs/generated/css'));
  });
});

gulp.task('clean-docs', function() {
  return gulp.src('./docs/generated/**/*', { read: false })
  .pipe(rm({async: false}));
});

gulp.task('publish-docs', function() {
  return gulp.src([ './docs/generated/**/*.*' ])
  .pipe(ghpages());
});

gulp.task('default', ['jshint', 'templates', 'scripts']);