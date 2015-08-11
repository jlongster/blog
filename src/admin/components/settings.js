const React = require('react/addons');
const classNames = require('classnames');
const dom = React.DOM;
const Checkbox = React.createFactory(require('./ui/Checkbox'));
const TextField = React.createFactory(require('./ui/TextField'));

// TextField, Checkbox

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

    this.props.onChange(name, value);
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

      this.props.validationError && dom.div(
        { className: 'form-field-errors' },
        this.props.validationError.msg
      ),

      dom.div(
        { className: 'form-field abstract' },
        dom.label(null, 'Abstract'),
        dom.textarea({
          type: 'textarea',
          name: 'abstract',
          value: post.abstract,
          onChange: this.updateField.bind(this, 'abstract')
        })
      ),
      TextField({ key: 'url',
                  name: 'shorturl',
                  value: post.shorturl,
                  errorText: getError(error, 'shorturl'),
                  onChange: this.updateField.bind(this, 'shorturl') }),
      TextField({ label: 'Tags (comma-separated)',
                  name: 'tags',
                  value: post.tags ? post.tags.join(',') : '',
                  onChange: this.updateField.bind(this, 'tags') }),
      TextField({ label: 'Read Next',
                  name: 'readnext',
                  value: post.readnext,
                  onChange: this.updateField.bind(this, 'readnext') }),
      TextField({ label: 'Header Image URL',
                  name: 'headerimg',
                  value: post.headerimg,
                  onChange: this.updateField.bind(this, 'headerimg') }),
      Checkbox({ label: 'Cover Image',
                 name: 'headerimgfull',
                 value: 'y',
                 checked: post.headerimgfull,
                 className: 'form-field-collapse',
                 onChange: this.updateField.bind(this, 'headerimgfull') }),
      TextField({ label: 'External Assets',
                  name: 'resource',
                  value: post.assets,
                  onChange: this.updateField.bind(this, 'assets') }),
      Checkbox({ label: 'Published',
                 className: 'published',
                 name: 'published',
                 value: 'y',
                 checked: post.published,
                 onChange: this.updateField.bind(this, 'published') })
    );
  }
});

module.exports = Settings;
