const path = require('path');

module.exports = {
    entry: './src/mwparser.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'mwparser.js',
        library: 'mwparser',
    },
    externals: {
        he: {
            commonjs: 'he',
            commonjs2: 'he',
            amd: 'he',
            root: 'he',
        },
        'js-md5': {
            commonjs: 'js-md5',
            commonjs2: 'js-md5',
            amd: 'js-md5',
            root: 'js-md5',
        },
    },
};
