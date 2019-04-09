const path = require('path');

module.exports = {
  entry: {
  	index:'./src/index.js',
  	dog: './src/dog.js',
  	cat: './src/cat.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
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