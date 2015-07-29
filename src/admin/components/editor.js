const React = require('react/addons');
const classNames = require('classnames');
const dom = React.DOM;

const Editor = React.createClass({
  getInitialState: function() {
    return { mounted: false,
             dragging: false };
  },

  componentDidMount: function() {
    require(
      ['static/js/editor/editor.js', 'static/css/codemirror-zenburn.css'],
      editor => {
        let CodeMirror = editor.CodeMirror;
        let node = React.findDOMNode(this);
        let mirror = CodeMirror(node, {
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
        this.setState({ mounted: true });
      }
    );
  },

  componentDidUpdate: function() {
    let mirror = this.mirror;
    if(mirror && !this.changeFired) {
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
    return dom.div({ className: classNames({ 'editor': true, 'dragging': this.state.dragging },
                                           this.state.mounted ? 'mounted' : '',
                                           this.props.className),
                     style: this.props.style,
                     onDragOver: this.handleDragOver,
                     onDragEnd: this.handleDragEnd,
                     onDrop: this.handleDrop });
  }
});

module.exports = Editor;
