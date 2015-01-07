const React = require('react');
const { Element, Elements } = require('../lib/react-util');
const Post = Element(require('./post'));
const t = require("transducers.js");
const config = require('../lib/config');

const dom = React.DOM;
const { div, ul, li, a } = dom;

const Preview = React.createClass({
  displayName: 'Preview',

  statics: {
    bodyClass: 'post'
  },

  getInitialState: function() {
    return { post: null };
  },

  componentDidMount: function() {
    window.addEventListener('message', ev => {
      console.log(ev.data.content);
      if(ev.origin !== config.get('url')) {
        return;
      }

      let post = ev.data.post;
      this.setState({ post: post });
    }, false);
  },

  render: function() {
    console.log(this.state.post);
    if(!this.state.post) {
      return div(null, 'Loading...');
    }

    let post = t.merge({ date: '19840620' }, this.state.post);

    // The data property is a littly funky because usually it's set up
    // by the data fetching layer, but we just want to render a fake
    // post
    return Post({
      data: {
        post: {
          post: post
        }
      }
    });
  }
});

module.exports = Preview;
