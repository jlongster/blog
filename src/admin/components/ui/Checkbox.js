const React = require('react');
const dom = React.DOM;
const classNames = require('classnames');

const Checkbox = React.createClass({

  render: function() {
    // TODO(jwl): yeah yeah, this is a hack
    var id = 'form-input-' + this.props.name;

    return dom.div(
      { className: classNames('form-field form-field-checkbox',
                              this.props.className) },
      dom.input({
        type: 'checkbox',
        id: id,
        name: this.props.name,
        value: this.props.value,
        checked: this.props.checked,
        onChange: this.props.onChange
      }),
      dom.label({
        htmlFor: id
      }, this.props.label)
    );
  }
});

module.exports = Checkbox;
