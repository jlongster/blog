const React = require('react');
const classNames = require('classnames');
const { displayDate } = require("../../lib/date");
const { prevented } = require("../../lib/util");

const dom = React.DOM;
const Link = React.createFactory(require("react-router").Link);

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
      dom.div(
        { className: 'actions left' },
        !this.props.isNew &&
          Link({ to: 'post', params: { post: this.props.shorturl }},
               'Back')
      ),
      dom.strong(null, this.props.title),
      dom.span(null,
               ' \u2014 ',
               (this.props.date ? displayDate(this.props.date) : 'Today')),
      dom.div(
        { className: 'actions right' },
        dom.a({ href: '#', onClick: prevented(this.handleSave) },
              'Save'),
        dom.a({ href: '#',
                onClick: prevented(this.props.onDelete) },
              'Delete')
      )
    );
  }
});

module.exports = Toolbar;
