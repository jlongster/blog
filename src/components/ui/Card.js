const React = require('react');
const dom = React.DOM;
const classNames = require('classnames');
const mdl = require('../../lib/mdl');

const Card = React.createClass({
  componentDidMount: function() {
    require(['../../lib/mdl/material-pink.css']);
  },

  render: function() {
    return dom.div(
      { className: classNames('mdl-card mdl-shadow--3dp', this.props.className) },
      this.props.children
    );
  }
});

module.exports = Card;
