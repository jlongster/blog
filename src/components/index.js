const t = require('transducers.js');
const React = require('react');
const { takeAll } = require('../lib/util');
const { connect, autoconnect } = require('../lib/redux');
const { displayDate } = require('../lib/date');
const statics = require('impl/statics');
const actions = require('../actions/posts');

const Header = React.createFactory(require('./header'));
const Footer = React.createFactory(require('./footer'));
const Link = React.createFactory(require('react-router').Link);
const dom = React.DOM;
const { div, a } = dom;

let Index = React.createClass({
  displayName: 'Index',

  statics: {
    pageClass: 'index',

    populateStore: ({ dispatch, state }, { params }) => {
      params = Object.assign({
        limit: 5
      }, params);

      return dispatch(actions.queryPosts({
        name: 'index',
        select: ['title', 'date', 'shorturl', 'abstract'],
        limit: params.limit
      }));
    },

    select: state => ({
      posts: state.posts.getIn(['postsByQueryName', 'index'])
    })
  },

  render: function () {
    console.log(this.props.posts);
    if(!this.props.posts) {
      return null;
    }
    const posts = this.props.posts;

    return div(
      null,
      Header(
        { className: 'collapse' },
        div(
          { className: 'intro light' },
          div(
            null,
            'My name is ',
            dom.a({ href: 'http://twitter.com/jlongster' }, 'James'),
            ', and I work on the Firefox Developer Tools. I like to create things and write about technology.'
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
              dom.h1(null, Link({ to: '/' + post.shorturl }, post.title)),
              div({ className: 'date' }, displayDate(post.date)),
              dom.p({ dangerouslySetInnerHTML: { __html: post.abstract }})
            );
          }),
          div({ className: 'right-link' },
              Link({ to: '/archive'}, 'View All Posts'))
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

module.exports = autoconnect(Index);
