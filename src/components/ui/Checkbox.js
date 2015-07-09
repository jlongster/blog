const React = require('react');
const dom = React.DOM;
const { merge, toObj } = require('transducers.js');
const classNames = require('classnames');
const mdl = require('../../lib/mdl');

const Checkbox = React.createClass({
  componentDidMount: function() {
    require(['../../lib/mdl/material-pink.css']);
    mdl.upgradeElement(React.findDOMNode(this), 'MaterialCheckbox');
  },

  componentDidUnmount: function() {
    mdl.downgradeElement(React.findDOMNode(this));
  },

  render: function() {
    var id = 'id' + (Math.random().toString());
    return dom.label(
      { className: classNames('mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect',
                              this.props.classNames),
        htmlFor: id },
      dom.input({
        type: 'checkbox',
        id: id,
        className: 'mdl-checkbox__input',
        name: this.props.name,
        value: this.props.value,
        checked: !!this.props.defaultSwitched,
        onChange: this.props.onCheck
      }),
      dom.span({
        className: 'mdl-checkbox__label'
      }, this.props.label)
    );
  }
});

module.exports = Checkbox;
