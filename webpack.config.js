const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  entry: './static/js/main.js',
  output: {
    path: path.join(__dirname, 'static/build'),
    filename: 'client.js'
  },
  module: {
    loaders: [{
      test: /\.less$/,
      loader: ExtractTextPlugin.extract('style-loader', 'css!less')
    }]
  },
  plugins: [
    new ExtractTextPlugin('styles.css')
  ]
}
