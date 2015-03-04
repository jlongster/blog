const React = require('react/addons');
const t = require("transducers.js");
const { map, filter } = t;
const debounce = require('debounce');
const { slugify, Element, Elements } = require('../lib/util');
const { TextField, Checkbox, Paper } = Elements(require('material-ui'));
const { displayDate } = require("../lib/date");
const csp = require('js-csp');
const { go, chan, take, put, ops } = csp;
const { currentDate } = require("../lib/date");
const { Link } = Elements(require("react-router"));
const Main = Element(require('./main'));
const Feedback = Element(require('./feedback'));
const dom = React.DOM;
const cx = React.addons.classSet;
const api = require('impl/api');
const config = require('../lib/config');

const updatePreview = debounce(function(previewWindow, post) {
  if(previewWindow) {
    previewWindow.postMessage({ post: post }, config.get('url'));
  }
}, 200);

const Editor = Element(React.createClass({
  getInitialState: function() {
    return { dragging: false };
  },

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

        mirror.on('drop', (m, e) => {
          let { line, ch } = m.coordsChar({ left: e.clientX,
                                            top: e.clientY});

          e.preventDefault();
          let files = e.dataTransfer.files;
          let formdata = new FormData();
          for(var i=0; i<files.length; i++) {
            formdata.append('file', files[i]);
          }

          var xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/upload');
          xhr.onload = function() {
            m.setCursor(line, ch);
            if(xhr.status === 200) {
              m.replaceRange('![](' + xhr.response + ')', { line: line, ch: ch });
            }
            else {
              m.replaceRange('(error uploading)', { line: line, ch: ch });
            }
          };

          xhr.send(formdata);
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

  handleDragOver: function() {
    this.setState({ dragging: true });
  },

  render: function() {
    return dom.div({ className: cx({ 'editor': true, 'dragging': this.state.dragging }),
                     style: this.props.style,
                     onDragOver: this.handleDragOver,
                     onDragEnd: this.handleDragEnd,
                     onDrop: this.handleDrop });
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
            'Delete'),
      dom.a({ href: '#',
              className: 'popout-preview',
              onClick: e => {
                e.preventDefault();
                this.props.onPopout();
              }},
            '\u2197')
    );
  }
}));

const Input = Element(React.createClass({
  render: function() {
    return dom.div(
      { className: 'form-group' },
      dom.label(null, this.props.label),
      (this.props.type === 'textarea' ? dom.textarea : TextField)({
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

// const Checkbox = Element(React.createClass({
//   render: function() {
//     return dom.div(
//       { className: 'checkbox' },
//       dom.label(
//         null,
//         dom.input({ type: 'checkbox',
//                     name: this.props.name,
//                     value: this.props.value,
//                     checked: this.props.checked,
//                     onChange: this.props.onChange }),
//         this.props.label
//       )
//     );
//   }
// }));

const Settings = Element(React.createClass({
  updateField: function(name, e) {
    let value = e.target.value;
    if(e.target.type === 'radio' || e.target.type === 'checkbox') {
      if(!e.target.checked) {
        value = false;
      }
      else {
        value = true;
      }
    }

    this.props.onUpdate(name, value);
  },

  render: function() {
    let post = this.props.post;
    let error = this.props.validationError;

    function getError(error, field) {
      return error.field === field ? error.msg : null;
    }

    return dom.form(
      { className: 'settings',
        method: 'post',
        style: this.props.style },
      dom.div(
        { className: 'abstract' },
        dom.label(null, 'Abstract'),
        Paper(
          { zDepth: 1 },
          dom.textarea({
            type: 'textarea',
            name: 'abstract',
            value: post.abstract,
            onChange: this.updateField.bind(this, 'abstract')
          })
        )
      ),
      TextField({ floatingLabelText: 'URL',
                  name: 'shorturl',
                  value: post.shorturl,
                  errorText: getError(error, 'shorturl'),
                  onChange: this.updateField.bind(this, 'shorturl') }),
      dom.div(
        { className: 'form-inline' },
        TextField({ floatingLabelText: 'Tags (comma-separated)',
                    name: 'tags',
                    value: post.tags ? post.tags.join(',') : '',
                    onChange: this.updateField.bind(this, 'tags') }),
        TextField({ floatingLabelText: 'Read Next',
                    name: 'readnext',
                    value: post.readnext,
                    onChange: this.updateField.bind(this, 'readnext') })
      ),
      dom.div(
        { className: 'form-inline' },
        TextField({ floatingLabelText: 'Header Image URL',
                    name: 'headerimg',
                    value: post.headerimg,
                    onChange: this.updateField.bind(this, 'headerimg') }),
        Checkbox({ label: 'Cover Image',
                   name: 'headerimgfull',
                   value: 'y',
                   defaultSwitched: post.headerimgfull,
                   onCheck: this.updateField.bind(this, 'headerimgfull') })
      ),
      TextField({ floatingLabelText: 'External Assets',
                  name: 'resource',
                  value: post.assets,
                  onChange: this.updateField.bind(this, 'assets') }),
      Checkbox({ label: 'Published',
                 className: 'published',
                 name: 'published',
                 value: 'y',
                 defaultSwitched: post.published,
                 onCheck: this.updateField.bind(this, 'published') })

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

    window.addEventListener('unload', () => {
      if(this.previewWindow) {
        this.previewWindow.close();
      }
    });
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
      if(!this.state.originalUrl) {
        yield api.createPost(post.shorturl);
      }
      else if(this.state.originalUrl !== post.shorturl) {
        yield api.renamePost(this.state.originalUrl, post.shorturl);
      }

      yield api.updatePost(post.shorturl, post);

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

    updatePreview(this.previewWindow, post);
    this.setState({ post: post });
  },

  handleToolbarSelect: function(name) {
    this.setState({ tab: name });
  },

  handlePopout: function() {
    go(function*() {
      let preview = window.open(
        '/preview',
        'preview',
        'width=800,height=600,resizable=1,scrollbars=1,dialog=1'
      );
      preview.focus();

      if(!this.previewWindow) {
        preview.addEventListener('load', () => {
          preview.postMessage({ post: this.state.post }, config.get('url'));
          preview.addEventListener('unload', () => {
            this.previewWindow = null;
          });
        }, false);
        this.previewWindow = preview;
      }
    }.bind(this));
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
      //Feedback(),
      Toolbar({ currentTab: state.tab,
                title: post.title,
                date: post.date,
                shorturl: post.shorturl,
                onSelect: this.handleToolbarSelect,
                onSave: this.handleSave,
                onDelete: this.handleDelete,
                onPopout: this.handlePopout }),
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
