const React = require('react/addons');
const PureRenderMixin = React.addons.PureRenderMixin;
const { slugify, mergeObj, prevented } = require('../lib/util');
const { connect } = require('../lib/redux');
const csp = require('js-csp');
const { go, chan, take, put, ops } = csp;
const { currentDate } = require("../lib/date");
const dom = React.DOM;
const api = require('impl/api');
const classNames = require('classnames');
const withLocalState = require('../lib/local-state');
const constants = require('../constants');

const postActions = require('../actions/posts');
const editorActions = require('../actions/editor');
const actions = Object.assign({}, postActions, editorActions);

const Editor = React.createFactory(require('./components/editor'));
const Toolbar = React.createFactory(require('./components/toolbar'));
const Settings = React.createFactory(require('./components/settings'));
const Pane = React.createFactory(require('./components/pane'));

const Edit = React.createClass({
  displayName: 'Edit',

  getInitialState: function() {
    return {
      post: this.props.post,
      validationError: null
    };
  },

  componentWillReceiveProps: function(nextProps) {
    if(this.props.post.shorturl !== nextProps.post.shorturl) {
      this.setState({ post: nextProps.post });
    }
  },

  componentDidMount: function() {
    require(['static/css/theme/editor.less']);
  },

  validate: function(post) {
    if(post.published &&
       this.props.post.shorturl !== post.shorturl) {
      this.setState({
        post: mergeObj(post, { shorturl: this.props.post.shorturl }),
        validationError: {
          field: 'shorturl',
          msg: 'Cannot change the URL of a published post'
        }
      });

      return false;
    }

    this.setState({ validationError: null });
    return true;
  },

  handleSettingsChange: function(name, value) {
    let updates = {}
    if(name === 'tags') {
      updates[name] = value.split(',');
    }
    else {
      updates[name] = value;
    }
    this.setState({ post: mergeObj(this.state.post, updates) });
  },

  handleChange: function(text) {
    let match = text.match(/^\s*# ([^\n]*)\n\n/m);
    if(!match) {
      console.log('badly-formed document');
      return;
    }

    let post = this.state.post;
    let updates = {};
    updates.title = match[1];
    updates.content = text.slice(match[0].length);
    if(!this.props.post.shorturl) {
      updates.shorturl = post.title ? slugify(post.title) : '';
    }

    this.setState({ post: mergeObj(post, updates)});
  },

  handleSave: function() {
    let post = this.state.post;
    if(!post.published || !post.date) {
      post = mergeObj(post, { date: currentDate() });
    }

    if(!this.validate(post)) {
      return;
    }

    this.props.actions.savePost(this.props.post, post);
  },

  handleDelete: function() {
    if(confirm('Are you sure?')) {
      this.props.actions.deletePost(this.props.post.shorturl);
    }
  },

  render: function () {
    let ui = this.props.ui;
    let post = this.state.post;
    let actions = this.props.actions;

    if(!post.shorturl && this.props.queryParams.post !== 'new') {
      return dom.div(
        { className: 'edit-container' },
        dom.div({ className: 'edit-main'}, 'no post found')
      );
    }

    let doc = '\n# ' + post.title + '\n\n' + post.content;

    return dom.div(
      { className: 'edit-container' },
      Toolbar({ title: post.title,
                date: post.date,
                shorturl: post.shorturl,
                isNew: !this.props.post.shorturl,
                onSave: this.handleSave,
                onDelete: this.handleDelete,
                onShowSettings: actions.toggleSettings,
                onShowPreview: actions.togglePreview }),
      dom.div(
        { className: 'edit-main' },
        Editor({ key: 'editor',
                 url: post.shorturl,
                 content: doc,
                 onChange: this.handleChange,
                 className: ui.showPreview ? 'uncentered' : '' }),
        dom.a({ href: '#',
                className: 'settings',
                onClick: prevented(actions.toggleSettings) },
              "Settings \u2192"),
        Pane(
          { width: 500,
            side: "left",
            open: ui.showSettings,
            onClose: actions.toggleSettings },
          Settings({
            post: post,
            validationError: this.state.validationError,
            onClose: actions.toggleSettings,
            onChange: this.handleSettingsChange
          })
        ),
        dom.div(
          { className: 'preview',
            style: { width: ui.showPreview ? 200 : 0 } },
          dom.div({ onClick: actions.togglePreview },
                  "SHOW ME DAT PREVIEW")
        )
      )
    );
  }
});

const blankPost = {
  title: '',
  content: '',
  published: false
};

module.exports = connect(withLocalState(Edit), {
  pageClass: 'edit',
  queryParamsProp: 'params',
  actions: actions,

  populateStore: function(dispatch, state, params) {
    const id = decodeURI(params.post);
    if(id !== 'new') {
      dispatch(actions.getPost(id));
   }
  },

  select: function(state, params) {
    const id = decodeURI(params.post);
    const post = state.posts.getIn(['postsById', id]);
    return {
      post: post || blankPost,
      ui: state.editor
    }
  }
});
