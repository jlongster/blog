const t = require("transducers.js");
const React = require("react");
const dom = React.DOM;
const { Element, Elements } = require("../lib/react-util");
const { Link } = Elements(require("react-router"));

const { takeAll } = require("../lib/chan-util");
const { displayDate } = require("../lib/date");
const csp = require("../lib/csp");
const { go, chan, take, put, ops } = csp;
const api = require("impl/api");
const statics = require("impl/statics");
const Page = Element(require('./page'));

let Index = React.createClass({
  displayName: "Index",
  statics: {
    fetchData: function (api) {
      return api.getPosts(7);
    }
  },

  render: function () {
    var posts = this.props.data['index'];
    return Page(
      null,
      dom.div(
        { className: "intro" },
        "My name is ",
        dom.a({ href: "http://twitter.com/jlongster" }, "James"),
        ". I hope you like to create things and read about technology." +
          " That's pretty much what I do here. ",
        dom.strong(null, "Read my latest post:")),
      dom.div({ className: "major-post" },
              dom.h1(null,
                     Link({ to: 'post',
                            params: { post: posts[0].shorturl }},
                          posts[0].title)),
              dom.p({ dangerouslySetInnerHTML: { __html: posts[0].abstract }})),
      dom.section(
        { className: 'posts' },
        dom.h2(null, 'Posts'),
        dom.ul({ className: 'list' }, posts.map(post => {
          return dom.li(
            { className: 'clearfix',
              key: post.shorturl },
            Link({ to: 'post',
                   params: { post: post.shorturl }},
                 post.title),
            dom.div({ className: 'date' }, displayDate(post.date))
          );
        })),
        Link({ to: 'archive', className: 'btn btn-primary' },
             'View All Posts')
      ),
      dom.div(
        { dangerouslySetInnerHTML: { __html: statics.projectsHTML }}
      ),
      dom.script({
        src: 'http://jlongster.com/s/header-cloth-demo/main.min.js'
      })
    );
  }
});

module.exports = Index;
