// Karma configuration
// Generated on Tue Aug 07 2018 18:06:26 GMT+0200 (CEST)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '.',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
        'node_modules/he/he.js',
        'node_modules/axios/dist/axios.min.js',
        'node_modules/js-md5/src/md5.js',
        'test/*.js',
        'src/*.js',
        {
            pattern: 'test/*.txt',
            included: false,
            watched:  true,
            served: true
        },
        {
            pattern: 'test/*.json',
            included: false,
            watched:  true,
            served: true
        },
        {
            pattern: 'test/*.html',
            included: false,
            watched:  true,
            served: true
        },
        {
            pattern: 'node_modules/diff/lib/index.es6.js',
            included: false,
            watched:  true,
            served: true
        }
    ],




    // list of files / patterns to exclude
    exclude: [
        'test/render-mw-fixtures.js'
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Firefox'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
