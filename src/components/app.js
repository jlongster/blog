const React = require('react');
const cookie = require('cookie');
const { Element, Elements } = require('../lib/util');
const { RouteHandler, Link } = Elements(require('react-router'));
const AuthError = Element(require('./auth-error'));
const ServerError = Element(require('./server-error'));
const Feedback = Element(require('./feedback'));
const ConfigRender = Element(require('./config-render'));

const dom = React.DOM;

const App = React.createClass({
  displayName: 'App',

  contextTypes: {
    getRouteAtDepth: React.PropTypes.func.isRequired,
    routeHandlers: React.PropTypes.array.isRequired
  },

  getInitialState: function() {
    // If we are told to wait, set the timeout state. It's important
    // when server rendering for this cookie is null on both sides so
    // the same markup is generated. (This is just for a demo)
    let c = cookie.parse(typeof document !== 'undefined' ?
                         document.cookie : '');
    let renderTimeout = c.renderTimeout ? parseInt(c.renderTimeout) : 0;
    return { renderTimeout: renderTimeout };
  },

  componentDidMount: function() {
    this.componentDidUpdate({});

    // If there's a timeout, wait and nullify it (This is just for a
    // demo)
    if(this.state.renderTimeout && this.state.renderTimeout <= 3000) {
      setTimeout(() => this.setState({ renderTimeout: null }),
                this.state.renderTimeout);
    }
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
    if(this.state.renderTimeout) {
      // If there's a timeout, don't render the app just yet (This is
      // just for a demo)
      return dom.div(
        null,
        ConfigRender(),
        'Waiting for ' + this.state.renderTimeout + ' seconds...'
      );
    }

    let routeState = this.props.routeState;
    let route = routeState.routes[routeState.routes.length - 1];
    let content;

    if(this.props.error) {
      content = ServerError({ error: this.props.error });
    }
    else if(route.handler.requireAdmin) {
      content = this.props.user.admin ? RouteHandler(this.props) : AuthError()
    }
    else {
      content = RouteHandler(this.props);
    }

    return dom.div(
      null,
      ConfigRender(),
      Feedback(),
      content,
      this.props.user.admin &&
        dom.div(
          { className: 'admin-header' },
          dom.span(null, 'Welcome ', dom.strong(null, this.props.user.name)),
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
