const React = require('react');
const ReactDOM = require('react-dom');
const { displayDate } = require('../lib/date');
const ghm = require('../lib/showdown-ghm.js');
const statics = require('impl/statics');
const { autoconnect } = require('../lib/redux');
const classNames = require('classnames');
const withLocalState = require('../lib/local-state');

const postActions = require('../actions/posts');
const pageActions = require('../actions/page');
const actions = Object.assign({}, postActions, pageActions);

const dom = React.DOM;
const { div, ul, li, a } = dom;
const Link = React.createFactory(require('react-router').Link);
const Page = React.createFactory(require('./page'));
const Block = React.createFactory(require('./block'));

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

const HeaderImage = React.createClass({
  getInitialState: function() {
    return { undersized: false };
  },

  componentDidMount: function() {
    // Yeah yeah hardcoded values. 1200 is the width of full-size
    // header images. I probably should abstract that out, but I got
    // cheezits to eat.
    this.setState({ undersized: window.innerWidth < 1200 });
    window.addEventListener('resize', this.handleWindowResize);
  },

  componentWillUnmount: function() {
    window.removeEventListener('resize', this.handleWindowResize);
  },

  handleWindowResize: function() {
    if(this.props.fullWidth) {
      if(window.innerWidth < 1200) {
        this.setState({ undersized: true });
      }
      else {
        this.setState({ undersized: false });
      }
    }
  },

  render: function() {
    return div(
      { className:
        classNames({ 'full-img': this.props.fullWidth,
                     'intro-img': !this.props.fullWidth,
                     'undersized': this.state.undersized,
                     'oversized': !this.state.undersized }) },
      div({ className: 'overlay' }),
      dom.img({ src: this.props.url })
    );
  }
});

const Post = React.createClass({
  displayName: 'Post',

  statics: {
    pageClass: 'post-page',

    populateStore: async function ({ dispatch, state }, { params }) {
      const id = decodeURI(params.post);
      const post = await dispatch(actions.getPost(id));

      if(post) {
        dispatch(actions.updatePageTitle(post.title));

        if(post.readnext) {
          await dispatch(actions.queryPosts({
            name: 'readnext',
            select: ['title', 'abstract', 'shorturl'],
            filter: { shorturl: post.readnext }
          }));
        }
      }
      else {
        console.log('WARNING: post not found: ' + id);
        dispatch(actions.updateErrorStatus(404));
      }
    },

    select: (state, { params }) => {
      const id = decodeURI(params.post);
      const readnextQuery = state.posts.getIn(['postsByQueryName', 'readnext']);
      return {
        post: state.posts.getIn(['postsById', id]),
        readnext: readnextQuery ? readnextQuery[0] : null
      };
    }
  },

  componentDidMount: function() {
    this.updateDOM();
  },

  componentDidUpdate: function(prevProps) {
    if(this.props.post !== prevProps.post) {
      this.updateDOM();
    }
  },

  updateDOM: function() {
    const node = ReactDOM.findDOMNode(this);
    if(!node) {
      return;
    }

    // TODO: turn markdown into React nodes
    const article = node.querySelector('article');
    const articleRect = article.getBoundingClientRect();

    const anchorables = node.querySelectorAll(
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

    const post = this.props.post;
    if(post && post.assets) {
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
      // TODO(jwl): Hack to replace commas because those aren't valid ids.
      // Need to disallows commas in URLs.
      { id: post.shorturl.replace(',', '-'),
        className: classNames({
          'has-bg-image': (post.headerimg &&
                           post.headerimgfull)
        })},

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
                Link({ to: '/' + next.shorturl }, next.title)
              ),
              dom.p({ dangerouslySetInnerHTML: { __html: next.abstract }})
            )
          )
        )
      ),

      post.headerimg &&
        React.createElement(
          HeaderImage,
          { url: post.headerimg,
            fullWidth: post.headerimgfull }
        ),

      dom.article(
        { className: 'post' },

        dom.div(
          { className: classNames('header-text',
                                  { 'has-bg-image': post.headerimgfull }) },
          dom.h1(null, post.title),
          div({ className: 'date' }, displayDate(post.date))
        ),
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

module.exports = autoconnect(Post);
