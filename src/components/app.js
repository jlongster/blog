const React = require('react');
const { Element, Elements } = require('../lib/util');
const { RouteHandler, Link } = Elements(require('react-router'));
const AuthError = Element(require('./auth-error'));
const ServerError = Element(require('./server-error'));
const Feedback = Element(require('./feedback'));

const dom = React.DOM;

const App = React.createClass({
  displayName: 'App',

  contextTypes: {
    getRouteAtDepth: React.PropTypes.func.isRequired,
    routeHandlers: React.PropTypes.array.isRequired
  },

  componentDidMount: function() {
    this.componentDidUpdate({});
  },

  componentDidUpdate: function(prevProps) {
    if(prevProps.bodyClass) {
      document.body.classList.remove(prevProps.bodyClass);
    }
    if(this.props.bodyClass) {
      document.body.classList.add(this.props.bodyClass);
    }
  },

  render: function () {
    let routeState = this.props.routeState;
    let route = routeState.routes[routeState.routes.length - 1];
    let content;

    if(this.props.error) {
      content = ServerError({ error: this.props.error });
    }
    else if(route.handler.requireAdmin) {
      content = this.props.isAdmin ? RouteHandler(this.props) : AuthError()
    }
    else {
      content = RouteHandler(this.props);
    }

    return dom.div(
      null,
      content,
      this.props.isAdmin &&
        dom.div(
          { className: 'admin-header' },
          dom.span(null, 'Welcome ', dom.strong(null, this.props.username)),
          Link({ to: 'drafts' }, 'Drafts'),
          route.name === 'post' &&
            Link({ to: 'edit', params: { post: routeState.params.post }}, 'Edit'),
          Link({ to: 'edit', params: { post: 'new' }}, 'New')
        )
    );
  }
});

module.exports = App;
