/**
 * ------------------------------------------
 * Gulpfile
 * ------------------------------------------
 * - Starts a server on default port (8000)
 * - Loads all available sources from /client folder
 * - Loads all bower and vendor components
 * - JADE and STYLUS processing
 * - Allows different bundling for production vs development instances 
 *     (see tasks "build:dev" and "build:prod")
 * - Uglifying/minifying js/css code
 * - Injects all file references to /public/index.html
 * ------------------------------------------
 */

var
    del = require('del'),
    gulp = require('gulp'),
    merge = require('merge-stream'),
    path = require('path'),
    pkg = require('./package.json'),
    plugins = require('gulp-load-plugins')(),
    runSequence = require('run-sequence'),
    stylish = require('jshint-stylish'),
    vinylPaths = require('vinyl-paths'),
    plumber = require('gulp-plumber');

var sources = {
  jshint: {
    client: {
      src: './client/**/*.js',
      jshintrc: './client/.jshintrc'
    },
    tests: {
      src: './tests/**/*.js',
      jshintrc: './tests/.jshintrc'
    }
  },

  stylus: './client/css/main.styl',

  jade: ['./client/**/*.jade', '!./client/html/index.jade'],
  index: './client/html/index.jade',

  dest: './public/' + pkg.version
};

// Vendor/bower plugins to load in specified order
var bowerfiles = {
  css: [
    'public/' + pkg.version + '/vendor/bootstrap/css/bootstrap.min.css',
  ],

  js: [
    'public/' + pkg.version + '/bower_components/angular/angular.min.js',
    'public/' + pkg.version + '/bower_components/angular-animate/angular-animate.min.js',
    'public/' + pkg.version + '/bower_components/angular-sanitize/angular-sanitize.min.js',
    'public/' + pkg.version + '/bower_components/angular-ui-router/release/angular-ui-router.min.js',
    'public/' + pkg.version + '/vendor/socket-io/socket.io.js',
    'public/' + pkg.version + '/bower_components/angular-socket-io/socket.min.js',
    'public/' + pkg.version + '/bower_components/momentjs/min/moment.min.js',
    'public/' + pkg.version + '/bower_components/momentjs/min/locales.min.js',
    'public/' + pkg.version + '/bower_components/humanize-duration/humanize-duration.js',
    'public/' + pkg.version + '/bower_components/angular-timer/dist/angular-timer.min.js',
  ]
};

var jadeOptions = {
  pretty: true,
  compileDebug: false,
  data: {
    pkg: pkg
  }
};

var stylusOptions = {
  paths: [
    './bower_components/normalize-css/'
  ],
  'include css': true
};

var injectOptions = { relative: true, addRootSlash: true };

// fonts etc. e.g. '//fonts.googleapis.com/css?family=Lato'
var cssCDN = [];

var cssCode = '\n\n';
var spacing = '    ';

cssCDN.forEach(function(value) {
  cssCode += spacing + '<link rel="stylesheet" href="' + value + '" />\n';
});

gulp.task('lint:client', function() {
  return gulp.src(sources.jshint.client.src)
    .pipe(plumber())
    .pipe(plugins.jscs())
    .pipe(plugins.jshint(sources.jshint.client.jshintrc))
    .pipe(plugins.jshint.reporter(stylish));
});

gulp.task('lint:tests', function() {
  return gulp.src(sources.jshint.tests.src)
    .pipe(plumber())
    .pipe(plugins.jscs())
    .pipe(plugins.jshint(sources.jshint.tests.jshintrc))
    .pipe(plugins.jshint.reporter(stylish));
});

gulp.task('copy:css', function() {
  return gulp.src(sources.stylus, { base: './client/' })
    .pipe(plugins.stylus(stylusOptions))
    .pipe(plugins.autoprefixer({ browsers: ['last 2 versions'] }))
    .pipe(gulp.dest(sources.dest));
});

gulp.task('copy:bower', function() {
  return gulp.src(['./bower_components/**/*', './vendor/**/*'], { base: './' })
    .pipe(gulp.dest(sources.dest));
});

gulp.task('copy:js', function() {
  return gulp.src('./client/js/**/*.js', { base: './client/' })
    .pipe(gulp.dest(sources.dest));
});

gulp.task('copy:index', function() {
  return gulp.src(sources.index)
    .pipe(plugins.jade(jadeOptions))
    .pipe(gulp.dest('./public/'));
});

gulp.task('copy:html', function() {
  return gulp.src(['./client/html/templates/**/*.jade', './client/html/directives/**/*.jade'], { base: './client/html/' })
    .pipe(plugins.jade(jadeOptions))
    .pipe(gulp.dest(sources.dest));
});

gulp.task('copy:fonts', function() {
  return gulp.src('./client/fonts/**/*.{ttf,woff,eot,svg}', { base: './client/' })
    .pipe(gulp.dest(sources.dest));
});

gulp.task('copy:img', function() {
  return gulp.src('./client/img/**/*', { base: './client/' })
    .pipe(gulp.dest(sources.dest));
});

gulp.task('copy:json', function() {
  return gulp.src('./client/json/*.json', { base: './client/' })
    .pipe(gulp.dest(sources.dest));
});

// delete everything inside /public
gulp.task('clean', function() {
  return gulp.src('./public/')
    .pipe(vinylPaths(del));
});

gulp.task('lint', ['lint:client']);

gulp.task('build:dev', ['lint'], function() {
  runSequence('clean', ['copy:css', 'copy:html', 'copy:js', 'copy:index', 'copy:fonts', 'copy:img', 'copy:json', 'copy:bower'], 'inject:dev', 'server', watch);
});

gulp.task('build:prod', ['lint'], function() {
  //runSequence('clean', ['copy:css', 'copy:html', 'copy:js', 'copy:index', 'copy:fonts', 'copy:img', 'copy:json', 'copy:bower'], 'optimize', 'inject:prod', 'clean:prod'); // proper production setup
  runSequence('clean', ['copy:css', 'copy:html', 'copy:js', 'copy:index', 'copy:fonts', 'copy:img', 'copy:json', 'copy:bower'], 'inject:dev');
});

// inject file references in /public/index.html at specified locations [uses gulp-inject]
gulp.task('inject:dev', function() {
  var cssFiles = bowerfiles.css.concat(['public/' + pkg.version + '/css/main.css']);
  var jsFilterFiles = bowerfiles.js.concat(['public/' + pkg.version + '/js/app/filters/*.js']);
  var jsServiceFiles = bowerfiles.js.concat(['public/' + pkg.version + '/js/app/services/*.js']);
  var jsDirectiveFiles = bowerfiles.js.concat(['public/' + pkg.version + '/js/app/directives/*.js']);
  var jsControllerFiles = bowerfiles.js.concat(['public/' + pkg.version + '/js/app/controllers/*.js']);
  var jsAppFile = bowerfiles.js.concat(['public/' + pkg.version + '/js/app/*.js']);
  var allFiles = cssFiles.concat(jsFilterFiles).concat(jsServiceFiles).concat(jsDirectiveFiles).concat(jsControllerFiles).concat(jsAppFile);

  var orderOfTheFiles = bowerfiles.css.concat(['main.css']);
  orderOfTheFiles = orderOfTheFiles.concat(bowerfiles.js);
  orderOfTheFiles = orderOfTheFiles.concat(['_app.js']);
  orderOfTheFiles = getOrderOfTheFiles(orderOfTheFiles);

  var allFilesStream = gulp.src(allFiles, { read: false })
    .pipe(plugins.order(orderOfTheFiles));

  return gulp.src('./public/index.html')
    .pipe(plugins.inject(allFilesStream, injectOptions))// will insert after <!-- inject:css --> and <!-- inject:js -->
    .pipe(plugins.injectString.after('<!-- inject:css -->', cssCode))//add cssCDN and other files
    .pipe(gulp.dest('./public'));
});

// minify css and uglify js code in production
gulp.task('optimize', function() {
  var cssFiles = bowerfiles.css.concat(['public/' + pkg.version + '/css/main.css']);
  var orderOfTheCssFiles = getOrderOfTheFiles(bowerfiles.css.concat(['main.css']));

  var processCSS = gulp.src(cssFiles)
    .pipe(plugins.order(orderOfTheCssFiles))
    .pipe(plugins.concat('app.min.css'))
    .pipe(plugins.minifyCss())
    .pipe(gulp.dest(sources.dest + '/css'));

  var jsFiles = bowerfiles.js.concat(['public/' + pkg.version + '/js/**/*.js']);
  var orderOfTheFiles = getOrderOfTheFiles(bowerfiles.js.concat(['_app.js']));

  var processJS = gulp.src(jsFiles)
    .pipe(plugins.order(orderOfTheFiles))
    .pipe(plugins.ngAnnotate())
    .pipe(plugins.concat('app.min.js'))
    .pipe(plugins.uglify())
    .pipe(gulp.dest(sources.dest + '/js'));

  return merge(processCSS, processJS);
});

// inject minified/uglified file references in /public/index.html at specified locations [uses gulp-inject]
gulp.task('inject:prod', function() {
  var allFiles = gulp.src([sources.dest + '/css/app.min.css', sources.dest + '/js/app.min.js'], { read: false });

  return gulp.src('./public/index.html')
    .pipe(plugins.inject(allFiles, injectOptions))// will insert after <!-- inject:css --> and <!-- inject:js -->
    .pipe(plugins.injectString.after('<!-- inject:css -->', cssCode))//add cssCDN and other files
    .pipe(gulp.dest('./public/'));
});

// remove all dev code and keep only minified/uglified files in production
gulp.task('clean:prod', function() {
  return gulp.src([sources.dest + '/bower_components/', sources.dest + '/css/**/*', '!' + sources.dest + '/css/app.min.css', sources.dest + '/js/**/*', '!' + sources.dest + '/js/app.min.js'], { read: false })
    .pipe(vinylPaths(del));
});

gulp.task('default', ['build:dev']);

gulp.task('server', function() {
  return gulp.src('./public')
    .pipe(plugins.webserver({
      livereload: true,
      open: true,
      https: false,
      fallback: 'index.html'
    }));
});


function watch() {
  gulp.watch('client/**/*.js', fileChanged('js'));
  gulp.watch('client/**/*.styl', ['copy:css']);
  gulp.watch(['client/**/*.jade', '!client/html/layouts/**/*.jade'], fileChanged('jade'));
  gulp.watch(['client/html/layouts/**/*.jade'], function() {
    return runSequence(['copy:html', 'copy:index'], 'inject:dev');
  });
  gulp.watch('client/fonts/**/*', ['copy:fonts']);
  gulp.watch('client/img/**/*', ['copy:img']);
}

// Helper methods below

function fileChanged(type) {
  return function(event) {
    var loc = event.path;

    console.log('\n' + path.basename(loc) + ' was ' + event.type);

    switch (event.type) {
      case 'added':
      case 'changed':
        return fileAddedOrChanged(type, loc, event.type);
      case 'deleted':
        return fileDeleted(loc);
    }
  };
}

function fileAddedOrChanged(type, loc, eventType) {
  switch (type) {
    case 'js':
      var jsfile = gulp.src(loc, { base: './client/' })
        .pipe(plumber())
        .pipe(plugins.jshint(sources.jshint.client.jshintrc))
        .pipe(plugins.jscs())
        .pipe(plugins.jshint.reporter(stylish))
        .pipe(gulp.dest(sources.dest));

      if (eventType != 'changed') {
        setTimeout(function() {
          runSequence('inject:dev');
        }, 200);
      }

      return jsfile;

    case 'jade':
      if (loc == __dirname + '/client/html/index.jade') {
        var file = gulp.src(loc, { base: './client/html/' })
          .pipe(plugins.jade(jadeOptions))
          .pipe(gulp.dest('./public'));

        setTimeout(function() {
          runSequence('inject:dev');
        }, 200);

        return file;
      }
      else {
        return gulp.src(loc, { base: './client/html/' })
          .pipe(plugins.jade(jadeOptions))
          .pipe(gulp.dest(sources.dest));
      }
  }
}

function fileDeleted(loc) {
  var file = gulp.src(deletePath(loc), { read: false })
    .pipe(vinylPaths(del));

  setTimeout(function() {
    runSequence('inject:dev');
  }, 200);

  return file;
}

function deletePath(loc) {
  var newPath = path.relative(__dirname + '/client/', loc);
  newPath = path.join(sources.dest, newPath);

  var end;

  switch (path.extname(newPath)) {
    case '.jade': end = path.basename(newPath, '.jade') + '.html'; break;
    case '.js': end = path.basename(newPath); break;
  }

  return path.dirname(newPath) + '/' + end;
}

function getOrderOfTheFiles(files) {
  var orderOfTheFiles = files;

  orderOfTheFiles.forEach(function(value, key) {
    orderOfTheFiles[key] = path.basename(value);
  });

  return orderOfTheFiles;
}
