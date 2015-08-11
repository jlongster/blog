const t = require("transducers.js");
const React = require("react");
const { takeAll } = require("../lib/util");
const { connect } = require("../lib/redux");
const { displayDate } = require("../lib/date");
const csp = require("js-csp");
const { go, chan, take, put, ops } = csp;
const statics = require("impl/statics");
const actions = require("../actions/blog");

const Link = React.createFactory(require("react-router").Link);
const Header = React.createFactory(require('./header'));
const Footer = React.createFactory(require('./footer'));

const dom = React.DOM;
const { div, a } = dom;

let Index = React.createClass({
  displayName: "Index",

  render: function () {
    if(!this.props.posts) {
      return null;
    }
    const posts = this.props.posts;

    return div(
      null,
      Header(
        { className: 'collapse' },
        div(
          { className: "intro light" },
          div(
            null,
            "My name is ",
            dom.a({ href: "http://twitter.com/jlongster" }, "James"),
            ", and I work on the Firefox Developer Tools. I like to create things and write about technology."
          )
        )
      ),
      dom.main(
        null,
        dom.section(
          { className: 'posts' },
          posts.map(post => {
            return div(
              { className: 'post',
                key: post.shorturl },
              dom.h1(null,
                     Link({ to: 'post',
                            params: { post: post.shorturl }},
                          post.title)),
              div({ className: 'date' }, displayDate(post.date)),
              dom.p({ dangerouslySetInnerHTML: { __html: post.abstract }})
            );
          }),
          div({ className: 'right-link' },
              Link({ to: 'archive'}, 'View All Posts'))
        ),
        div(
          { className: 'static-content',
            dangerouslySetInnerHTML: { __html: statics.projectsHTML }}
        )
      ),
      div({ className: 'additional-footer attribute' },
          div({ className: 'additional-footer-inner-ugh' },
              'Header image derived with permission from Steve Gildea, ',
              a({ href: 'http://suite3d.com/' }, 'suite3d.com'))),
      Footer()
    )
  }
});

module.exports = connect(Index, {
  pageClass: 'index',

  runQueries: function (dispatch, state) {
    dispatch(actions.queryPosts({
      name: 'index',
      select: ['title', 'date', 'shorturl', 'abstract'],
      limit: 5
    }));
  },

  select: function(state) {
    return {
      posts: state.posts.getIn(['postsByQueryName', 'index'])
    };
  }
});
