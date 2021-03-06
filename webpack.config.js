const path = require('path');
const webpack = require('webpack');
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


    //     module.exports = () => {
    //     return {
    //         output: {
    //             path: path.resolve(__dirname, 'build'),
    //             filename: 'app.js',
    //         },
    //         entry: './src/index.js',
    plugins: [
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    ],
    //     };
    // };



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
        'mongoose': {
            commonjs: 'mongoose',
            commonjs2: 'mongoose',
            amd: 'mongoose',
            root: 'mongoose'
        },
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
        'moment': {
            commonjs: 'moment',
            commonjs2: 'moment',
            amd: 'moment',
            root: 'moment'
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