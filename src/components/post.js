const React = require('react');
const { Element, Elements } = require('../lib/util');
const csp = require('js-csp');
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

const RandomMessage = Element(React.createClass({
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
}));

const Post = React.createClass({
  displayName: 'Post',
  statics: {
    fetchData: function (api, params) {
      return go(function*() {
        let post = yield api.getPost(decodeURI(params.post));
        if(!post) {
          return {};
        }

        let readnext;
        if(post.readnext) {
          let results = yield api.queryPosts({
            select: ['title', 'abstract', 'shorturl'],
            filter: { shorturl: post.readnext }
          });
          readnext = results[0];
        }
        return { post: post, readnext: readnext };
      }, { propagate: true });
    },

    bodyClass: 'post-page',
    title: function(props) {
      return props.post.post && props.post.post.title;
    }
  },

  componentDidMount: function() {
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

    let post = this.props.data['post'].post;
    if(post.assets) {
      // TODO: this is a big hack right now and I'm not even going to
      // explain why... let's just say I need to fix this
      let script = document.createElement('script');
      script.src = post.assets;
      this.getDOMNode().appendChild(script);
    }
  },

  render: function () {
    let post = this.props.data['post'].post;
    let next = this.props.data['post'].readnext;

    if(!post) {
      return NotFound();
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
                RandomMessage()
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

module.exports = Post;
