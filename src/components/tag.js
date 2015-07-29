const React = require('react');
const { Element, Elements } = require('../lib/util');
const csp = require('js-csp');
const { go, chan, take, put, ops } = csp;
const { Link } = Elements(require("react-router"));
const { displayDate } = require("../lib/date");
const Page = Element(require('./page'));
const actions = require("../actions/blog");
const { connect } = require("../lib/redux");

var dom = React.DOM;

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

module.exports = connect(Tag, {
  pageClass: 'tag',

  runQueries: function (dispatch, state, params) {
    dispatch(actions.queryPosts({
      name: 'tag',
      filter: { tags: params.tag },
      select: ['title', 'tags', 'shorturl', 'date']
    }));

    dispatch(actions.updatePage({
      title: 'Posts tagged ' + params.tag + ' - James Long'
    }));
  },

  select: function(state) {
    return {
      posts: state.getIn(['posts', 'postsByQueryName', 'tag'])
    };
  }
});
