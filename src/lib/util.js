var React = require("react");

function encodeTextContent(str) {
  return str.replace(/[<>&]/g, function(str) {
    return {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;'
    }[str];
  })
}

function decodeTextContent(str) {
  return str.replace(/(&lt;|&gt;|&amp;)/g, function(str) {
    return {
      '&lt;': '<',
      '&gt;': '>',
      '&amp;': '&'
    }[str];
  })
}

function slugify(name) {
  return name.replace(/[ \n!@#$%^&*():"'|?=]/g, '-');
}

function blockFor(name, children) {
  var block;
  React.Children.forEach(children, child => {
    if(child &&
       child.props &&
       child.props.name === name)
      block = child.props.children;
  });
  return block;
}

module.exports = {
  encodeTextContent,
  decodeTextContent,
  slugify,
  blockFor
};
