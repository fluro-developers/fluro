const path = require('path');
// var JsDocPlugin = require('jsdoc-webpack-plugin-v2');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'index.js',
        library: 'fluro',
        libraryTarget: 'umd',
        libraryExport: 'default',
        path: path.resolve(__dirname, 'dist'),
        globalObject: 'typeof self !== \'undefined\' ? self : this',
    },
    // plugins: [
    //       new JsDocPlugin(
    //       // {
    //       //     conf:path.join(__dirname, 'jsdoc.json'),
    //       // }
    //       )
    //   ],
    optimization: {
        // splitChunks: {
            // chunks: 'all'
        // }
    },

    externals: {
        'lodash': {
            commonjs: 'lodash',
            commonjs2: 'lodash',
            amd: 'lodash',
            root: '_'
        },
        'moment-timezone': {
            commonjs: 'moment-timezone',
            commonjs2: 'moment-timezone',
            amd: 'moment-timezone',
            root: 'moment-timezone'
        },
        'axios': {
            commonjs: 'axios',
            commonjs2: 'axios',
            amd: 'axios',
            root: 'axios'
        },
        'axios-extensions': {
            commonjs: 'axios-extensions',
            commonjs2: 'axios-extensions',
            amd: 'axios-extensions',
            root: 'axios-extensions'
        }
    },
    // output: {
    //   filename: 'main.js',
    //   path: path.resolve(__dirname, 'dist')
    // }
};