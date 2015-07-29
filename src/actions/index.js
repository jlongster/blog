const { mergeObj } = require('../lib/util');
const blog = require('./blog');
const editor = require('./editor');

module.exports = mergeObj(blog, editor);
