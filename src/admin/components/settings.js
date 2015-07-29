const React = require('react/addons');
const classNames = require('classnames');
const dom = React.DOM;

const Settings = React.createClass({
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

    this.props.updatePostMeta(name, value);
  },

  render: function() {
    let post = this.props.post;
    let error = this.props.validationError;

    function getError(error, field) {
      return error && (error.field === field ? error.msg : null);
    }

    return dom.form(
      { className: 'settings',
        method: 'post',
        style: this.props.style,
        onSubmit: e => e.preventDefault() },
      dom.button({ onClick: this.props.onClose }, "Close"),
      dom.div(
        { className: 'abstract' },
        dom.label(null, 'Abstract'),
        dom.textarea({
          type: 'textarea',
          name: 'abstract',
          value: post.abstract,
          onChange: this.updateField.bind(this, 'abstract')
        })
      ),
      TextField({ label: 'URL',
                  name: 'shorturl',
                  value: post.shorturl,
                  errorText: getError(error, 'shorturl'),
                  onChange: this.updateField.bind(this, 'shorturl') }),
      dom.div(
        { className: 'form-inline' },
        TextField({ label: 'Tags (comma-separated)',
                    name: 'tags',
                    value: post.tags ? post.tags.join(',') : '',
                    onChange: this.updateField.bind(this, 'tags') }),

        TextField({ label: 'Read Next',
                    name: 'readnext',
                    value: post.readnext,
                    onChange: this.updateField.bind(this, 'readnext') })
      ),
      dom.div(
        { className: 'form-inline' },
        TextField({ label: 'Header Image URL',
                    name: 'headerimg',
                    value: post.headerimg,
                    onChange: this.updateField.bind(this, 'headerimg') }),
        Checkbox({ label: 'Cover Image',
                   name: 'headerimgfull',
                   value: 'y',
                   defaultSwitched: post.headerimgfull,
                   onCheck: this.updateField.bind(this, 'headerimgfull') })
      ),
      TextField({ label: 'External Assets',
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
});

module.exports = Settings;
