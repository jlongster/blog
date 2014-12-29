const React = require('react/addons');
const nprogress = require('nprogress');
const t = require("transducers.js");
const { map, filter } = t;
const { displayDate } = require("../lib/date");
const { Element, Elements } = require('../lib/react-util');
const { slugify } = require('../lib/util');
const csp = require('../lib/csp');
const { currentDate } = require("../lib/date");
const { go, chan, take, put, ops } = csp;
const { Link } = Elements(require("react-router"));
const Main = Element(require('./main'));
const Feedback = Element(require('./feedback'));
const dom = React.DOM;
const cx = React.addons.classSet;
const api = require('impl/api');

const Editor = Element(React.createClass({
  componentDidMount: function() {
    require(
      ['static/js/editor/editor.js', 'static/css/codemirror-zenburn.css'],
      editor => {
        let CodeMirror = editor.CodeMirror;
        let mirror = CodeMirror(this.getDOMNode(), {
          value: this.props.content,
          lineWrapping: true,
          theme: 'zenburn',
          autofocus: true,
          mode: {
            name: 'markdown',
            fencedCodeBlocks: true
          }
        });

        // Set the cursor at the end of the post title
        mirror.setCursor(1, 1000);
        // For some reason, we need to force a refresh to make sure
        // the initial cursor position vertically lines up correctly
        setTimeout(() => mirror.refresh(), 100);

        mirror.on('change', (m, changes) => {
          if(changes.origin !== 'setValue') {
            this.changeFired = true;
            this.props.onChange(m.getValue());
          }
        });
        this.mirror = mirror;
      }
    );

    // Force all parentNodes to be 100%;
    let node = this.getDOMNode();
    while(node && node !== document) {
      if(!node.classList.contains('edit-container') &&
         node.tagName !== 'MAIN') {
        node.style.height = '100%';
      }
      node = node.parentNode;
    }
  },

  componentDidUpdate: function() {
    let mirror = this.mirror;
    if(!this.changeFired) {
      mirror.setValue(this.props.content);

      // Set the cursor at the end of the post title
      mirror.focus();
      mirror.setCursor(1, 1000);
    }

    this.changeFired = false;
  },

  render: function() {
    return dom.div({ className: 'editor',
                     style: this.props.style });
  }
}));

const Toolbar = Element(React.createClass({
  handleSave: function(e) {
    e.preventDefault();
    this.props.onSave();
  },

  render: function() {
    return dom.div(
      { className: 'toolbar' },
      dom.strong(null, this.props.title),
      dom.span(null,
               ' \u2014 ',
               (this.props.date ? displayDate(this.props.date) : 'Today')),
      dom.a({ href: '#', onClick: this.handleSave },
            'Save'),
      this.props.currentTab === 'editor' ?
        dom.a({ href: '#',
                onClick: e => {
                  e.preventDefault();
                  this.props.onSelect('settings')
                }},
              'Settings') :
        dom.a({ href: '#',
                onClick: e => {
                  e.preventDefault();
                  this.props.onSelect('editor')
                }},
              'Editor'),
      dom.a({ href: '#',
              onClick: e => {
                e.preventDefault();
                this.props.onDelete();
              }},
           'Delete')
    );
  }
}));

const Input = Element(React.createClass({
  render: function() {
    return dom.div(
      { className: 'form-group' },
      dom.label(null, this.props.label),
      (this.props.type === 'textarea' ? dom.textarea : dom.input)({
        type: 'input',
        name: this.props.name,
        value: this.props.value,
        className: cx({ 'form-control': true,
                        'errored': this.props.errored }),
        onChange: this.props.onChange
      })
    );
  }
}));

const Checkbox = Element(React.createClass({
  render: function() {
    return dom.div(
      { className: 'checkbox' },
      dom.label(
        null,
        dom.input({ type: 'checkbox',
                    name: this.props.name,
                    value: this.props.value,
                    checked: this.props.checked,
                    onChange: this.props.onChange }),
        this.props.label
      )
    );
  }
}));

const Settings = Element(React.createClass({
  updateField: function(name, e) {
    let value = e.target.value;
    if((e.target.type === 'radio' || e.target.type === 'checkbox') &&
       !e.target.checked) {
      value = null;
    }

    this.props.onUpdate(name, value);
  },

  save: function(e) {
    e.preventDefault();
    this.props.onSave();
  },

  render: function() {
    let post = this.props.post;
    let error = this.props.validationError;

    return dom.form(
      { className: 'settings',
        method: 'post',
        style: this.props.style },
      dom.div({ className: cx({'error-message': t.toArray(error).length}) },
              error.msg),
      Input({ label: 'Abstract',
              type: 'textarea',
              name: 'abstract',
              value: post.abstract,
              onChange: this.updateField.bind(this, 'abstract') }),
      Checkbox({ label: 'Published',
                 name: 'published',
                 value: true,
                 checked: post.published,
                 onChange: this.updateField.bind(this, 'published') }),
      Input({ label: 'Tags',
              name: 'tags',
              value: post.tags ? post.tags.join(',') : '',
              errored: error.field === 'tags',
              onChange: this.updateField.bind(this, 'tags') }),
      Input({ label: 'URL',
              name: 'shorturl',
              value: post.shorturl,
              errored: error.field === 'shorturl',
              onChange: this.updateField.bind(this, 'shorturl') }),
      Input({ label: 'Header Image',
              name: 'headerimg',
              value: post.headerimg,
              errored: error.field === 'headerimg',
              onChange: this.updateField.bind(this, 'headerimg') }),
      Checkbox({ label: 'Full Width Header',
                 name: 'headerimgfull',
                 value: true,
                 checked: post.headerimgfull,
                 onChange: this.updateField.bind(this, 'headerimgfull') }),
      Input({ label: 'Read Next',
              name: 'readnext',
              value: post.readnext,
              errored: error.field === 'readnext',
              onChange: this.updateField.bind(this, 'readnext') })
      // dom.button({ className: 'btn btn-default',
      //              onClick: this.save },
      //            'Update')
    );
  }
}));

const Edit = React.createClass({
  displayName: 'Edit',
  statics: {
    fetchData: function (api, params) {
      return api.getPost(decodeURI(params.post));
    },
    bodyClass: 'edit'
  },

  componentDidMount: function() {
    require(['static/css/editor.less']);
  },

  getInitialState: function() {
    return this.makeInitialState(this.props);
  },

  makeInitialState: function(props) {
    let post = props.data['edit'] || {
      title: '',
      content: '',
      published: false
    };

    return { tab: 'editor',
             post: post,
             originalUrl: post.shorturl,
             validationError: {} };
  },

  componentWillReceiveProps: function(nextProps) {
    if(nextProps.post !== this.state.post) {
      this.setState(this.makeInitialState(nextProps));
    }
  },

  validate: function() {
    let post = this.state.post;
    if(post.published &&
       this.state.originalUrl !== post.shorturl) {
      this.setState({
        tab: 'settings',
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
    let post = this.state.post;
    if(!post.published || !post.date) {
      post.date = currentDate();
    }

    if(!this.validate()) {
      return;
    }

    go(function*() {
      yield api.savePost(t.merge(post, { originalUrl: this.state.originalUrl }));

      if(this.state.originalUrl !== post.shorturl) {
        relocate('/edit/' + post.shorturl);
      }
      else {
        relocate('/' + post.shorturl);
      }
    }.bind(this));
  },

  handleUpdate: function(name, value) {
    let post = this.state.post;
    if(name === 'tags') {
      post[name] = value.split(',');
    }
    else {
      post[name] = value;
    }
    this.setState({ post: post });
  },

  handleDelete: function() {
    if(confirm('Are you sure?')) {
      go(function*() {
        yield api.deletePost(this.state.post.shorturl);
        relocate('/');
      }.bind(this));
    }
  },

  handleChange: function(text) {
    let match = text.match(/^\s*# ([^\n]*)\n\n/m);
    if(!match) {
      console.log('badly-formed document');
      return;
    }

    let post = this.state.post;
    post.title = match[1];
    post.content = text.slice(match[0].length);
    if(!this.state.originalUrl) {
      post.shorturl = post.title ? slugify(post.title) : '';
    }

    this.setState({ post: post });
  },

  handleToolbarSelect: function(name) {
    this.setState({ tab: name });
  },

  render: function () {
    let state = this.state;
    let post = state.post;

    if(!post.shorturl && this.props.params.post !== 'new') {
      return dom.div(
        { className: 'edit-container' },
        Main({ className: 'edit'}, 'no post found')
      );
    }

    let doc = '\n# ' + post.title + '\n\n' + post.content;
    let tab = state.tab;

    return dom.div(
      { className: 'edit-container' },
      Feedback(),
      Toolbar({ currentTab: state.tab,
                title: post.title,
                date: post.date,
                onSelect: this.handleToolbarSelect,
                onSave: this.handleSave,
                onDelete: this.handleDelete }),
      Main({ className: 'edit' },
           Editor({ style: { display: tab === 'editor' ? 'block' : 'none' },
                    content: doc,
                    onChange: this.handleChange }),
           Settings({ style: { display: tab === 'settings' ? 'block' : 'none' },
                      post: post,
                      validationError: state.validationError,
                      onUpdate: this.handleUpdate,
                      onSave: this.handleSave
                    }))
    );
  }
});

module.exports = Edit;
