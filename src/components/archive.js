const React = require('react');
const csp = require('js-csp');
const { displayDate } = require("../lib/date");
const { go, chan, take, put, ops } = csp;
const Immutable = require('immutable');
const actions = require("../actions/blog");
const { connect } = require("../lib/redux");

const Link = React.createFactory(require("react-router").Link);
const Main = React.createFactory(require('./main'));
const Header = React.createFactory(require("./header"));
const Page = React.createFactory(require('./page'));

var dom = React.DOM;

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

module.exports = connect(Archive, {
  pageClass: 'posts',
  title: 'All Posts - James Long',

  runQueries: function (dispatch) {
    dispatch(actions.queryPosts({
      name: 'all',
      select: ['title', 'date', 'shorturl']
    }));
  },

  select: function(state, params) {
    return {
      posts: state.getIn(['posts', 'postsByQueryName', 'all'])
    };
  }
});
