const path = require('path');

module.exports = {
  entry:'./src/index.js',
  output:{
  	filename:'index.js',
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