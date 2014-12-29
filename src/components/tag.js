const React = require('react');
const { Element, Elements } = require('../lib/react-util');
const csp = require('../lib/csp');
const { go, chan, take, put, ops } = csp;
const { Link } = Elements(require("react-router"));
const { displayDate } = require("../lib/date");
const Page = Element(require('./page'));

var dom = React.DOM;

var Tag = React.createClass({
  displayName: 'Tag',
  statics: {
    fetchData: function (api, params) {
      return api.queryPosts({
        filter: { tags: params.tag },
        select: ['title', 'tags', 'shorturl', 'date']
      });
    }
  },

  render: function () {
    let posts = this.props.data['tag'];
    return Page(
      { className: 'posts' },
      dom.h1(null, 'Tag: ' + this.props.routeState.params.tag),
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

module.exports = Tag;
