const path = require('path');
// var JsDocPlugin = require('jsdoc-webpack-plugin-v2');

module.exports = {
  entry:'./src/index.js',
  output:{
  	filename:'index.js',
    path: path.resolve(__dirname, 'dist')
  },
  // plugins: [
  //       new JsDocPlugin(
  //       // {
  //       //     conf:path.join(__dirname, 'jsdoc.json'),
  //       // }
  //       )
  //   ],
  optimization: {
     splitChunks: {
       chunks: 'all'
     }
   }
  // output: {
  //   filename: 'main.js',
  //   path: path.resolve(__dirname, 'dist')
  // }
};