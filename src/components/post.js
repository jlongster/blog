const React = require('react');
const { Element, Elements } = require('../lib/util');
const csp = require('../lib/csp');
const { go, chan, take, put, ops } = csp;
const { Link } = Elements(require('react-router'));
const Page = Element(require('./page'));
const Block = Element(require('./block'));
const NotFound = Element(require('./not-found'));
const { displayDate } = require('../lib/date');
const ghm = require('../lib/showdown-ghm.js');
const statics = require('impl/statics');

const dom = React.DOM;
const { div, ul, li, a } = dom;

const Post = React.createClass({
  displayName: 'Post',
  statics: {
    fetchData: function (api, params) {
      return go(function*() {
        let post = yield api.getPost(decodeURI(params.post));
        if(!post) {
          return {};
        }
        let readnext = yield api.getPost(post.readnext);
        return { post: post, readnext: readnext };
      }, { propagate: true });
    },

    bodyClass: 'post'
  },

  getInitialState: function() {
    return { content: null };
  },

  componentDidMount: function() {
    window_firePostMount(this.props.data['post']);
  },

  componentWillUnmount: function() {
    window_firePostUnmount(this.props.data['post']);
  },

  render: function () {
    let post = this.props.data['post'].post;
    let next = this.props.data['post'].readnext;

    if(!post) {
      return NotFound();
    }

    return Page(
      null,
      Block(
        { name: 'after-header' },
        post.headerimg && post.headerimgfull &&
          div({ name: 'after-header' },
              dom.img({ src: post.headerimg }))
      ),
      Block(
        { name: 'before-content' },
        div(
          { className: 'extra' },
          ul(
            null,
            li(null, a({ href: 'https://twitter.com/jlongster' }, 'twitter')),
            li(null, a({ href: 'https://github.com/jlongster/' }, 'github')),
            li(null, a({ href: 'http://feeds.feedburner.com/jlongster' }, 'rss'))
          )
        )
      ),
      Block(
        { name: 'before-footer' },
        div(
          null,
          div({ className: 'readnext' },
              next && [
                dom.h3(null, 'Read Next'),
                a({ href: '/' + next.shorturl }, dom.h1(null, next.title)),
                dom.p({ dangerouslySetInnerHTML: { __html: next.abstract }})
              ]),
          div({ dangerouslySetInnerHTML: { __html: statics.commentsHTML }})
        )
      ),
      dom.article(
        { className: 'clearfix' },
        post.headerimg && !post.headerimgfull &&
          div({ className: 'intro-img' },
              dom.img({ src: post.headerimg })),
        dom.h1(null, post.title),
        div({ className: 'date' }, displayDate(post.date)),
        div({ dangerouslySetInnerHTML: {
          __html: ghm.parse(this.state.content || post.content)
        }}),
        div({ className: 'tags' },
            post.tags && post.tags.map(tag => {
              return dom.a({ href: '/tag/' + tag }, tag);
            })),
        div(
          { className: 'social' },
          div({ className: 'social-buttons',
                dangerouslySetInnerHTML: { __html: statics.socialHTML }})
        )
      )
    );
  }
});

module.exports = Post;
