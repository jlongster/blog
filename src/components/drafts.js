const React = require('react');
const { Element, Elements } = require('../lib/react-util');
const { Link } = Elements(require("react-router"));
const csp = require('../lib/csp');
const { displayDate } = require("../lib/date");
const { go, chan, take, put, ops } = csp;
const Main = Element(require('./main'));
const Header = Element(require("./header"));
const Page = Element(require('./page'));

const dom = React.DOM;

const Drafts = React.createClass({
  displayName: 'Drafts',
  statics: {
    fetchData: function (api, params, isAdmin) {
      return api.queryDrafts({
        select: ['title', 'date', 'shorturl'],
      });
    },
    requireAdmin: true
  },

  render: function () {
    let posts = this.props.data['drafts'];
    return Page(
      null,
      dom.h1(null, 'Drafts'),
      dom.ul(null, posts.map(post => {
        return dom.li(
          { key: post.shorturl },
          Link({ to: 'post',
                 params: { post: post.shorturl }},
               post.title),
          dom.div({ className: 'date' }, displayDate(post.date))
        );
      }))
    );
  }
});

module.exports = Drafts;
