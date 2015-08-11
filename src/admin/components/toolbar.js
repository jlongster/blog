const React = require('react');
const classNames = require('classnames');
const { displayDate } = require("../../lib/date");
const dom = React.DOM;

const Toolbar = React.createClass({
  statics: {
    queries: ['panes']
  },

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
      dom.div(
        { className: 'actions' },
        dom.a({ href: '#', onClick: this.handleSave },
              'Save'),
        dom.a({ href: '#',
                onClick: e => {
                  e.preventDefault();
                  this.props.onDelete();
                }},
              'Delete')
      )
    );
  }
});

module.exports = Toolbar;
