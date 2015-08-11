const React = require('react');
const csp = require('js-csp');
const { go, chan, take, put, ops } = csp;
const { displayDate } = require('../lib/date');
const ghm = require('../lib/showdown-ghm.js');
const statics = require('impl/statics');
const actions = require("../actions/blog");
const { connect } = require("../lib/redux");

const dom = React.DOM;
const { div, ul, li, a } = dom;
const Link = React.createFactory(require("react-router").Link);
const Page = React.createFactory(require('./page'));
const Block = React.createFactory(require('./block'));
const NotFound = React.createFactory(require('./not-found'));

const RandomMessage = React.createClass({
  getInitialState: function() {
    // We have to keep this in state because we randomly choose one of
    // these, but we can't run that on the server so do it in
    // componentDidMount
    let messages = [
      'to tell me why I\'m wrong.',
      'to discuss this post.',
      'to tell me why you\'re disgusted.',
      'to tell me what you love about this.',
      'to hate on me.'
    ];
    return { messages: messages, messageSuffix: '' };
  },

  componentDidMount: function() {
    let messages = this.state.messages;
    let messageSuffix = messages[Math.random()*messages.length | 0];
    this.setState({ messageSuffix: messageSuffix });
  },

  render: function() {
    return dom.div(
      null,
      a({ href: 'https://twitter.com/jlongster' }, 'Tweet at me'),
      ' ' + this.state.messageSuffix
    );
  }
});

const Post = React.createClass({
  displayName: 'Post',

  componentDidMount: function() {
    if(!this.getDOMNode()) {
      return;
    }

    // TODO: turn markdown into React nodes
    let article = this.getDOMNode().querySelector('article');
    let articleRect = article.getBoundingClientRect();

    let anchorables = this.getDOMNode().querySelectorAll(
      'article h2, article h3, article h4'
    );
    for(var i=0; i<anchorables.length; i++) {
      let anchorable = anchorables[i];
      let anchor = document.createElement('a');
      anchor.href = '#' + anchorable.id;
      anchor.className = 'text-anchor';
      anchor.textContent = '#';
      anchorable.appendChild(anchor);
    }

    let post = this.props.post;
    if(post.assets) {
      // TODO: this is a big hack right now and I'm not even going to
      // explain why... let's just say I need to fix this
      let script = document.createElement('script');
      script.src = post.assets;
      this.getDOMNode().appendChild(script);
    }
  },

  render: function () {
    let post = this.props.post;
    let next = this.props.readnext;

    if(!post) {
      return null;
    }

    return Page(
      // TODO: Hack to replace commas because those aren't valid ids.
      // Need to disallows commas in URLs.
      { id: post.shorturl.replace(',', '-') },

      Block(
        { name: 'after-header' },
        post.headerimg && post.headerimgfull &&
          div(null, dom.img({ src: post.headerimg }))
      ),

      Block(
        { name: 'before-footer' },
        div(
          { className: 'additional-footer' },
          div(
            { className: 'additional-footer-inner-ugh' },
            div(
              { className: 'meta' },
              div(
                { className: 'comments' },
                React.createElement(RandomMessage)
              ),
              div({ className: 'social',
                    dangerouslySetInnerHTML: { __html: statics.socialHTML }})
            ),
            next && div(
              { className: 'readnext' },
              dom.h3(
                null,
                'Read Next: ',
                a({ href: '/' + next.shorturl }, next.title)
              ),
              dom.p({ dangerouslySetInnerHTML: { __html: next.abstract }})
            )
          )
        )
      ),

      dom.article(
        { className: 'post' },
        post.headerimg && !post.headerimgfull &&
          div({ className: 'intro-img' },
              dom.img({ src: post.headerimg })),

        dom.h1(null, post.title),
        div({ className: 'date' }, displayDate(post.date)),
        div({ dangerouslySetInnerHTML: {
          __html: ghm.parse(post.content)
        }}),
        div(
          { className: 'tags' },
          post.tags && post.tags.map(tag => {
            return dom.a({ key: tag, href: '/tag/' + tag }, tag);
          })
        )
      )
    );
  }
});

module.exports = connect(Post, {
  pageClass: 'post-page',

  runQueries: function (dispatch, state, params) {
    const id = decodeURI(params.post);

    go(function*() {
      const post = yield dispatch(actions.getPost(id));

      if(post && post.readnext) {
        dispatch(actions.queryPosts({
          name: 'readnext',
          select: ['title', 'abstract', 'shorturl'],
          filter: { shorturl: post.readnext }
        }));
      }

      dispatch(actions.updatePage({
        title: post.title
      }));
    });
  },

  select: function(state, params) {
    const id = decodeURI(params.post);
    const readnextQuery = state.posts.get(['postsByQueryName', 'readnext']);
    return {
      post: state.posts.getIn(['postsById', id]),
      readnext: readnextQuery ? readnextQuery[0] : null
    };
  }
});
