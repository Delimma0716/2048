const gulp = require("gulp");
const { series, parallel, src, dest } = require('gulp');
const babel = require('gulp-babel');
const uglify = require("gulp-uglify");
const autoprefixer = require("gulp-autoprefixer");
const cssmin = require("gulp-cssmin");
const webserver = require("gulp-webserver");
const webpack = require('webpack-stream');

// babel
function babelTrans() {
    return src('./src/*.js')
        .pipe(babel({
            presets: ["@babel/env"]
        }))
        .pipe(uglify())
        .pipe(dest('./output/'));
}

// css加前缀 压缩
function cssPrefix() {
    return gulp.src("./src/*.css")
        .pipe(autoprefixer("last 2 version", "> 1%", "not dead", "safari 5", "not ie <= 8", "opera 12.1", "ios 6-7", "android 4"))
        .pipe(cssmin())
        .pipe(gulp.dest("./output/"))
}

// webpack build
function build() {
    return gulp.src('./output/game.js')
        .pipe(webpack({
            output: {
                filename: "game.bundle.js"
            }
        }))
        .pipe(gulp.dest('./dist/'));
}

// 本地devServer
function runDevServer() {
    return gulp.src("./")
        .pipe(webserver({
            host: "localhost",
            port: 3000,
            livereload: true,
            open: "/",
        }))
}

exports.dev = series(parallel(babelTrans, cssPrefix), build, runDevServer);
exports.babelTrans = babelTrans
exports.cssPrefix = cssPrefix
exports.default = series(parallel(babelTrans, cssPrefix), build);


