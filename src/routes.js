const t = require('transducers.js');
const { Element, Elements } = require('./lib/util');
const csp = require('./lib/csp');
const { go, chan, take, put, ops } = csp;
const { takeAll } = require('./lib/util');

const App = require('./components/app');
const Page = require('./components/page');
const Index = require('./components/index');
const Post = require('./components/post');
const Tag = require('./components/tag');
const Archive = require('./components/archive');
const Drafts = require('./components/drafts');
const Edit = require('./components/edit');
const Preview = require('./components/preview');
const NotFound = require('./components/not-found');

const Router = require('react-router');
const { Route, DefaultRoute, NotFoundRoute } = Elements(Router);

var hljs = require('highlight.js/lib/highlight.js'); // (jwl)
hljs.registerLanguage('scheme', require('./lib/scheme-highlight.js'));
hljs.registerLanguage('javascript', require('highlight.js/lib/languages/javascript'));

const routes = Route(
  { handler: App },
  Route({ name: 'index', path: '/', handler: Index }),
  Route({ name: 'tag', path: '/tag/:tag', handler: Tag }),
  Route({ name: 'archive', handler: Archive }),
  Route({ name: 'drafts', handler: Drafts }),
  Route({ name: 'preview', handler: Preview }),
  Route({ name: 'post', path: '/:post', handler: Post }),
  Route({ name: 'edit', path: '/edit/:post', handler: Edit }),
  NotFoundRoute({ handler: NotFound })
);

module.exports = routes;
