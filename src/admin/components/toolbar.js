const React = require('react');
const classNames = require('classnames');
const { displayDate } = require("../../lib/date");
const { prevented } = require("../../lib/util");

const dom = React.DOM;
const { div, a } = dom;

const Toolbar = React.createClass({
  statics: {
    queries: ['panes']
  },

  handleSave: function(e) {
    e.preventDefault();
    this.props.onSave();
  },

  render: function() {
    return div(
      { className: 'toolbar' },
      div(
        { className: 'actions left' },
        this.props.isNew ?
          a({ href: '/' }, 'Home') :
          a({ href: '/' + this.props.shorturl }, 'Back')
      ),
      dom.strong(null, this.props.title),
      dom.span(null,
               ' \u2014 ',
               (this.props.date ? displayDate(this.props.date) : 'Today')),
      div(
        { className: 'actions right' },
        a({ href: '#', onClick: prevented(this.handleSave) }, 'Save'),
        !this.props.isNew &&
          a({ href: '#',
              onClick: prevented(this.props.onDelete) },
            'Delete')
      )
    );
  }
});

module.exports = Toolbar;
