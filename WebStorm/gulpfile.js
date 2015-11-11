"use strict";

var settings = {
    DEBUG: false,
    CSS_MINIFY: true,
    CSS_SOURCEMAP: false
};


var gulp = require('gulp');
var minifyCSS = require('gulp-minify-css');
var babelify = require('babelify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var rename = require('gulp-rename');
var zip = require('gulp-zip');
var sourceMap = require('gulp-sourcemaps');
var sass = require('gulp-sass');
var replace = require('gulp-replace');
var autoprefixer = require('gulp-autoprefixer');
var notify = require("gulp-notify");
var stringify = require("stringify");

var path = {
    JSX: ['src/*.jsx', 'src/**/*.jsx'],
    DEST_BUILD: 'build/',
    DEST_BUILD_CSS: 'build/css',
    DEST_BUILD_FONTS: 'build/fonts',
    DEST_TEMP_BUILD_CSS: 'src/assets/temp',
    SRC_SASS: 'src/assets/css/',
    /* === IMAGES === */
    SRC_IMAGES: 'src/assets/images',
    DEST_BUILD_IMAGES: 'build/images',
    /* === LIBRARIES === */
    DEST_BUILD_LIBRARIES: 'build/js',
    /* === VISUAL STUDIO === */
    DEST_VS: '../Synapse.SP.EmployeeDirectory/Assets',
    DEST_VS_BU: '../External',
};

gulp.task('sass', function () {
    // WITH MINIFY
    var pipe = gulp.src(
        [
            path.SRC_SASS + 'main.scss'
        ]
    );

    if (settings.CSS_SOURCEMAP) {
        pipe = pipe.pipe(sourceMap.init());
    }

    pipe = pipe.pipe(sass())
        .on('error', handleError);

    pipe = pipe.pipe(autoprefixer({browser: ['last 2 versions']}));

    if (settings.CSS_MINIFY)
        pipe = pipe.pipe(minifyCSS());

    if (settings.CSS_SOURCEMAP) {
        pipe = pipe.pipe(sourceMap.write());
    }

    return pipe
        .pipe(rename('main.css'))
        .pipe(gulp.dest(path.DEST_BUILD_CSS));
});


gulp.task('build', function () {
    let t = browserify({
        entries: ['src/app.jsx'],
        paths: ['./src']
    });
    t = t.transform(stringify(['.txt']))
        .transform(babelify);

    if (!settings.DEBUG) {
        t = t.transform({global: true}, 'uglifyify');
    }
    t.bundle()
        .on('error', handleError)
        .pipe(source('app.js'))
        .pipe(gulp.dest(path.DEST_BUILD + 'js'));
});

gulp.task('copyToVS', ['sass', 'build', 'ZIP'], function () {
    return gulp.src('build/**/*')
        .pipe(gulp.dest(path.DEST_VS));
});

gulp.task('copyToVSNoBuild', function () {
    return gulp.src('build/**/*')
        .pipe(gulp.dest(path.DEST_VS));
});

gulp.task('ZIP', function () {
    return gulp.src(['**/*', '!node_modules/**/*'])
        .pipe(zip('ReactJS.zip'))
        .pipe(gulp.dest(path.DEST_VS_BU));
});

function handleError() {

    var args = Array.prototype.slice.call(arguments);

    // Send error to notification center with gulp-notify
    notify.onError({
        title: "Compile Error",
        message: "<%= error.message %>"
    }).apply(this, args);

    // Keep gulp from hanging on this task
    this.emit('end');
}
