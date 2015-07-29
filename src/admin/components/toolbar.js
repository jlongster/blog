const React = require('react/addons');
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
      !this.props.showSettings &&
        dom.button({ className: "btn-action left",
                     onClick: () => this.props.onShowSettings() },
                   "Settings \u2192"),
      dom.strong(null, this.props.title),
      dom.span(null,
               ' \u2014 ',
               (this.props.date ? displayDate(this.props.date) : 'Today')),
      dom.a({ href: '#', onClick: this.handleSave },
            'Save'),
      dom.a({ href: '#',
              onClick: e => {
                e.preventDefault();
                this.props.onDelete();
              }},
            'Delete'),
      !this.props.showPreview &&
        dom.button({ className: "btn-action right",
                     onClick: () => this.props.onShowPreview() },
                   "\u2190 Preview")
    );
  }
});

module.exports = Toolbar;
