const React = require('react');
const { connect } = require('../lib/redux');
const actions = require('../actions/page');

const Page = React.createFactory(require('./page'));
const dom = React.DOM;

const NotFound = React.createClass({
  displayName: 'NotFound',

  render: function() {
    return Page(
      null,
      dom.h1(null, 'Four, Oh Four'),
      `This page could not be found. If you're looking for an
old post, it's probably lost. If you're looking for a specific page,
I don't know what happened.`
    );
  }
});

module.exports = connect(NotFound, {
  populateStore: function(dispatch) {
    return dispatch(actions.updateErrorStatus(404));
  }
});
