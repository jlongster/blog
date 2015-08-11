const React = require('react');
const classNames = require('classnames');
const { prevented } = require("../../lib/util");

const dom = React.DOM;

const Pane = React.createClass({
  render: function() {
    const side = this.props.side;
    const open = 0;
    const closed = this.props.width * (side === "right" ? 1 : -1);

    return dom.div(
      { className: 'pane-container' },

      dom.div(
        { className: 'pane',
          style: {
            left: side === "right" ? "auto" : 0,
            right: side === "right" ? 0 : "auto",
            width: this.props.width,
            transform: 'translateX(' + (this.props.open ? open : closed) + 'px)'
          }},
        this.props.children,
        dom.a({ className: 'closer',
                href: '#',
                onClick: prevented(this.props.onClose) },
              'x')
      )
    );
  }
});

module.exports = Pane;
