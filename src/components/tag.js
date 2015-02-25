const React = require('react');
const { Element, Elements } = require('../lib/util');
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
    },

    bodyClass: 'tag'
  },

  render: function () {
    let posts = this.props.data['tag'];
    return Page(
      null,
      dom.h1(null, 'Posts tagged with "' + this.props.routeState.params.tag + '"'),
      dom.ul({ className: 'list post-list' }, posts.map(post => {
        return dom.li(
          { key: post.shorturl },
          Link({ to: 'post',
                 params: { post: post.shorturl }},
               post.title),
          ' ',
          dom.span({ className: 'date' }, displayDate(post.date))
        );
      }))
    )
  }
});

module.exports = Tag;
