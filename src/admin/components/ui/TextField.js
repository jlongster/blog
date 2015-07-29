const React = require('react');
const dom = React.DOM;
const classNames = require('classnames');
const mdl = require('../../../lib/mdl');

const TextField = React.createClass({
  componentDidMount: function() {
    require(['../../../lib/mdl/material-pink.css']);
    mdl.upgradeElement(React.findDOMNode(this), 'MaterialTextfield');
  },

  componentDidUnmount: function() {
    mdl.downgradeElement(React.findDOMNode(this));
  },

  render: function() {
    var id = 'id' + (Math.random().toString());
    return dom.div(
      { className: classNames('mdl-textfield mdl-js-textfield mdl-textfield--floating-label',
                              this.props.classNames) },
      dom.input({
        type: 'text',
        id: id,
        className: 'mdl-textfield__input',
        name: this.props.name,
        value: this.props.value,
        onChange: this.props.onCheck
      }),
      dom.label({
        className: 'mdl-textfield__label',
        htmlFor: id
      }, this.props.label)
    );
  }
});

module.exports = TextField;
