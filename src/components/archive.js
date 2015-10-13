const React = require('react');
const csp = require('js-csp');
const { displayDate } = require("../lib/date");
const { go, chan, take, put, ops } = csp;
const Immutable = require('immutable');
const { connect } = require("../lib/redux");
const actions = require("../actions/posts");

const Main = React.createFactory(require('./main'));
const Header = React.createFactory(require("./header"));
const Page = React.createFactory(require('./page'));
const dom = React.DOM;
const { div, a } = dom;

var Archive = React.createClass({
  displayName: 'Archive',

  render: function () {
    let posts = this.props.posts;
    if(!posts) {
      return null;
    }

    return Page(
      null,
      dom.h1(null, 'All Posts'),
      dom.ul({ className: 'list post-list' }, posts.map(post => {
        return dom.li(
          { key: post.shorturl },
          a({ href: '/' + post.shorturl }, post.title),
          ' ',
          dom.span({ className: 'date' }, displayDate(post.date))
        );
      }))
    )
  }
});

module.exports = connect(Archive, {
  pageClass: 'posts',
  title: 'All Posts - James Long',

  runQueries: function (dispatch) {
    return dispatch(actions.queryPosts({
      name: 'all',
      select: ['title', 'date', 'shorturl']
    }));
  },

  select: function(state, params) {
    return {
      posts: state.posts.getIn(['postsByQueryName', 'all'])
    };
  }
});
