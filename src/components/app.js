const React = require('react');
const cookie = require('cookie');
const { connect } = require("../lib/redux");
const Router = require('react-router');

const dom = React.DOM;
const AuthError = React.createFactory(require('./auth-error'));
const ServerError = React.createFactory(require('./server-error'));
const Feedback = React.createFactory(require('./feedback'));
const RouteHandler = React.createFactory(Router.RouteHandler);
const Link = React.createFactory(Router.Link);

const App = React.createClass({
  displayName: 'App',

  render: function () {
    let routeState = this.props.route.routeState;
    let route = routeState.routes[routeState.routes.length - 1];
    let content;
    let user = this.props.route.user;

    // TODO(jwl): this error is never set anywhere?
    // if(this.props.route.error) {
    //   content = ServerError({ error: this.props.error });
    // }
    if(route.handler.requireAdmin) {
      content = user.admin ? RouteHandler(this.props) : AuthError()
    }
    else {
      content = RouteHandler(this.props);
    }

    return dom.div(
      null,
      Feedback(),
      content,
      user.admin &&
        dom.div(
          { className: 'admin-header' },
          dom.span(null, 'Welcome ', dom.strong(null, user.name)),
          Link({ to: 'drafts' }, 'Drafts'),
          route.name === 'post' &&
            Link({ to: 'edit', params: { post: routeState.params.post }}, 'Edit'),
          Link({ to: 'edit', params: { post: 'new' }}, 'New'),
          dom.a({ href: '/logout' }, 'Logout')
        )
    );
  }
});

module.exports = App;
