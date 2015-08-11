const React = require('react');
const dom = React.DOM;
const classNames = require('classnames');

const TextField = React.createClass({
  render: function() {
    // TODO(jwl): yeah yeah, this is a hack
    var id = 'form-input-' + this.props.name;

    return dom.div(
      { className: classNames('form-field form-field-text',
                              this.props.className) },
      dom.label({
        htmlFor: id
      }, this.props.label),
      dom.input({
        type: 'text',
        id: id,
        name: this.props.name,
        value: this.props.value,
        onChange: this.props.onChange
      })
    );
  }
});

module.exports = TextField;
