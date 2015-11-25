const React = require('react');
const { displayDate } = require("../lib/date");
const { connect } = require("../lib/redux");

const postActions = require('../actions/posts');
const pageActions = require('../actions/page');
const actions = Object.assign({}, postActions, pageActions);

const Link = React.createFactory(require('react-router').Link);
const Page = React.createFactory(require('./page'));
const dom = React.DOM;
const { div, a } = dom;

var Tag = React.createClass({
  displayName: 'Tag',

  render: function () {
    let posts = this.props.posts;
    if(!posts) {
      return null;
    }

    return Page(
      null,
      dom.h1(null, 'Posts tagged with "' + this.props.queryParams.tag + '"'),
      dom.ul({ className: 'list post-list' }, posts.map(post => {
        return dom.li(
          { key: post.shorturl },
          Link({ to: '/' + post.shorturl }, post.title),
          ' ',
          dom.span({ className: 'date' }, displayDate(post.date))
        );
      }))
    )
  }
});

module.exports = connect(Tag, {
  pageClass: 'tag',
  queryParamsProp: 'params',

  populateStore: function (dispatch, state, params) {
    dispatch(actions.updatePageTitle('Posts tagged ' + params.tag + ' - James Long'));
    return dispatch(actions.queryPosts({
      name: 'tag',
      filter: { tags: params.tag },
      select: ['title', 'tags', 'shorturl', 'date']
    }));
  },

  select: function(state) {
    return {
      posts: state.posts.getIn(['postsByQueryName', 'tag'])
    };
  }
});
