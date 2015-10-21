const React = require('react/addons');
const PureRenderMixin = React.addons.PureRenderMixin;
const { connect } = require("../lib/redux");
const Router = require('react-router');
const { updatePath, updatePageTitle, updatePageClass } = require('../actions/route');

const Link = React.createFactory(require('react-router').Link);
const AuthError = React.createFactory(require('./auth-error'));
const ServerError = React.createFactory(require('./server-error'));
const NotFound = React.createFactory(require('./not-found'));
const Feedback = React.createFactory(require('./feedback'));
const RouteHandler = React.createFactory(Router.RouteHandler);
const dom = React.DOM;
const { div, a } = dom;

const App = React.createClass({
  displayName: 'App',

  updatePage: function(prevProps, nextProps) {
    document.title = nextProps.title;

    if(prevProps) {
      const prevComponent = prevProps.routes[prevProps.routes.length - 1].component;
      if(prevComponent.pageClass) {
        document.body.classList.remove(prevComponent.pageClass);
      }
    }

    const component = nextProps.routes[nextProps.routes.length - 1].component;
    if(component.pageClass) {
      document.body.classList.add(component.pageClass);
    }
  },

  componentDidMount: function() {
    this.updatePage(null, this.props);
  },

  componentWillReceiveProps: function(nextProps) {
    this.updatePage(this.props, nextProps);
  },

  render: function () {
    let route = this.props.routes[this.props.routes.length - 1];
    let user = this.props.user;

    if(this.props.errorStatus === 404) {
      return NotFound();
    }
    else if(this.props.errorStatus === 500) {
      return ServerError();
    }

    return div(
      null,
      Feedback(),
      (!route.requireAdmin || user.admin) ?
        this.props.children :
        AuthError(),
      user.admin &&
        div(
          { className: 'admin-header' },
          dom.span(null, 'Welcome ', dom.strong(null, user.name)),
          Link({ to: "/drafts" }, 'Drafts'),
          route.path === ':post' &&
            Link({ to: '/edit/' + this.props.params.post }, 'Edit'),
          Link({ to: '/edit/new' }, 'New'),
          a({ href: '/logout' }, 'Logout')
        )
    );
  }
});

module.exports = connect(App, {
  namedActions: { updatePageTitle },
  select: function(state) {
    return {
      user: state.route.user,
      title: state.route.title,
      errorStatus: state.route.errorStatus
    }
  }
});
