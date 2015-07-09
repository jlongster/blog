const React = require('react');
const dom = React.DOM;
const { merge, toObj } = require('transducers.js');
const classNames = require('classnames');
const mdl = require('../../lib/mdl');

const Button = React.createClass({
  componentDidMount: function() {
    require(['../../lib/mdl/material-pink.css']);
    mdl.upgradeElement(React.findDOMNode(this), 'MaterialButton');
  },

  componentDidUnmount: function() {
    mdl.downgradeElement(React.findDOMNode(this));
  },

  render: function() {
    return dom.button(merge(toObj(this.props), {
      className: classNames(
        this.props.className,
        'mdl-button mdl-js-button mdl-button--colored', {
          'mdl-button--raised': !!this.props.flat
        }
      )
    }), this.props.children);
  }
});

module.exports = Button;
