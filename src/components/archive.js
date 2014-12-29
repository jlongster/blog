const React = require('react');
const { Element, Elements } = require('../lib/react-util');
const csp = require('../lib/csp');
const { displayDate } = require("../lib/date");
const { go, chan, take, put, ops } = csp;
const { Link } = Elements(require("react-router"));
const Main = Element(require('./main'));
const Header = Element(require("./header"));
const Page = Element(require('./page'));

var dom = React.DOM;

var Archive = React.createClass({
  displayName: 'Archive',
  statics: {
    fetchData: function (api, params) {
      return api.queryPosts({
        select: ['title', 'date', 'shorturl']
      });
    },
    bodyClass: 'posts'
  },

  render: function () {
    let posts = this.props.data['archive'];
    return Page(
      null,
      dom.h1(null, 'All Posts'),
      dom.ul({ className: 'list' }, posts.map(post => {
        return dom.li(
          { className: 'clearfix',
            key: post.shorturl },
          Link({ to: 'post',
                 params: { post: post.shorturl }},
               post.title),
          dom.div({ className: 'date' }, displayDate(post.date))
        );
      }))
    )
  }
});

module.exports = Archive;
