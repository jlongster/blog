const React = require('react');
const csp = require('js-csp');
const { displayDate } = require("../lib/date");
const { go, chan, take, put, ops } = csp;
const { connect } = require("../lib/redux");
const actions = require("../actions/posts");

const Link = React.createFactory(require('react-router').Link);
const Main = React.createFactory(require('./main'));
const Header = React.createFactory(require("./header"));
const Page = React.createFactory(require('./page'));
const dom = React.DOM;
const { div, a } = dom;

const Drafts = React.createClass({
  displayName: 'Drafts',

  render: function () {
    let posts = this.props.posts;
    if(!posts) {
      return null;
    }

    return Page(
      null,
      dom.h1(null, 'Drafts'),
      dom.ul({ className: 'list post-list' }, posts.map(post => {
        return dom.li(
          { key: post.shorturl },
          Link({ to: '/' + post.shorturl }, post.title),
          ' ',
          dom.span({ className: 'date' }, displayDate(post.date))
        );
      }))
    );
  }
});

module.exports = connect(Drafts, {
  requireAdmin: true,

  populateStore: function (dispatch) {
    dispatch(actions.queryDrafts({
      name: 'drafts',
      select: ['title', 'date', 'shorturl'],
    }));
  },

  select: function(state) {
    return {
      posts: state.posts.getIn(['postsByQueryName', 'drafts'])
    };
  }
});
