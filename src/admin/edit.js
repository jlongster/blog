const React = require('react/addons');
const { slugify, mergeObj, invariant, Element, Elements } = require('../lib/util');
const { connect } = require('../lib/redux');
const csp = require('js-csp');
const { go, chan, take, put, ops } = csp;
const { currentDate } = require("../lib/date");
const dom = React.DOM;
const api = require('impl/api');
const classNames = require('classnames');

const actions = require('../actions');
const constants = require('../constants');

const Button = Element(require('./components/ui/Button'));
const Checkbox = Element(require('./components/ui/Checkbox'));
const TextField = Element(require('./components/ui/TextField'));
const Card = Element(require('./components/ui/Card'));

const Editor = Element(require('./components/editor'));
const Toolbar = Element(require('./components/toolbar'));
const Settings = Element(require('./components/settings'));
const Pane = Element(require('./components/pane'));

const Edit = React.createClass({
  displayName: 'Edit',

  componentDidMount: function() {
    require(['static/css/editor.less'], () => { console.log('got i!') });
  },

  getInitialState: function() {
    return this.makeInitialState(this.props);
  },

  makeInitialState: function(props) {
    return { originalUrl: '',
             validationError: {} };
  },

  validate: function(post) {
    if(post.published &&
       post.originalUrl !== post.shorturl) {
      this.setState({
        validationError: {
          field: 'shorturl',
          msg: 'Cannot change the URL of a published post'
        }
      });

      return false;
    }

    this.setState({ validationError: {} });
    return true;
  },

  handleSave: function() {
    let post = this.props.post.toJS();
    if(!post.published || !post.date) {
      post = mergeObj(post, { date: currentDate() });
    }

    if(!this.validate(post)) {
      return;
    }

    go(function*() {
      if(!post.originalUrl) {
        yield api.createPost(post.shorturl);
      }
      else if(post.originalUrl !== post.shorturl) {
        yield api.renamePost(post.originalUrl, post.shorturl);
      }

      yield api.updatePost(post.shorturl, post);

      if(post.originalUrl !== post.shorturl) {
        relocate('/edit/' + post.shorturl);
      }
      else {
        relocate('/' + post.shorturl);
      }
    }.bind(this));
  },

  handleDelete: function() {
    if(confirm('Are you sure?')) {
      go(function*() {
        yield api.deletePost(this.state.post.get('shorturl'));
        relocate('/');
      }.bind(this));
    }
  },

  render: function () {
    let ui = this.props.ui;
    let post = this.props.post;
    let actions = this.props.actions;

    if(!post) {
      return null;
    }

    console.log('post', post);
    if(!post.shorturl && this.props.queryParams.post !== 'new') {
      return dom.div(
        { className: 'edit-container' },
        dom.div({ className: 'edit-main'}, 'no post found')
      );
    }

    let doc = '\n# ' + post.title + '\n\n' + post.content;

    return dom.div(
      { className: 'edit-container' },
      //Feedback(),
      Toolbar({ title: post.title,
                date: post.date,
                shorturl: post.shorturl,
                onSave: this.handleSave,
                onDelete: this.handleDelete,
                onShowSettings: actions.toggleSettings,
                onShowPreview: actions.togglePreview }),
      dom.div({ className: 'edit-main' },
              Editor({ content: doc,
                       onChange: actions.updatePost,
                       className: ui.showPreview ? 'uncentered' : '' }),
              Pane(
                { width: 650,
                  side: "left",
                  open: ui.showSettings,
                  onClose: actions.toggleSettings },
                "hello"
                // Settings({
                //   post: post,
                //   validationError: null,
                //   // onSave: this.handleSave,
                //   // onClose: () => this.setState({ settingsOpen: false })
                // })
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

module.exports = connect(Edit, {
  pageClass: 'edit',
  actions: actions,

  runQueries: function(dispatch, state, params) {
    const id = decodeURI(params.post);
    dispatch(actions.getPost(id));
  },

  select: function(state, params) {
    const id = decodeURI(params.post);
    const post = state.getIn(['posts', 'postsById', id]);
    return {
      post: post ? mergeObj(post, { originalUrl: post.shorturl }) : null,
      ui: state.get('editor')
    }
  }
});
