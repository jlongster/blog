const t = require("transducers.js");
const React = require("react");
const { Element, Elements } = require("../lib/util");
const { Link } = Elements(require("react-router"));
const { takeAll } = require("../lib/util");
const { displayDate } = require("../lib/date");
const csp = require("../lib/csp");
const { go, chan, take, put, ops } = csp;
const api = require("impl/api");
const statics = require("impl/statics");

const Header = Element(require('./header'));
const Footer = Element(require('./footer'));

const dom = React.DOM;
const { div, a } = dom;

let Index = React.createClass({
  displayName: "Index",
  statics: {
    fetchData: function (api) {
      return api.queryPosts({
        select: ['title', 'date', 'shorturl', 'abstract'],
        limit: 5
      });
    },

    bodyClass: 'index'
  },

  render: function () {
    var posts = this.props.data['index'];
    return div(
      null,
      Header(
        { className: 'collapse' },
        div(
          { className: "intro light" },
          div(
            null,
            "My name is ",
            dom.a({ href: "http://twitter.com/jlongster" }, "James"),
            ", and I work on the Firefox Developer Tools. I like to create things and write about technology."
          )
        )
      ),
      dom.main(
        null,
        dom.section(
          { className: 'posts' },
          posts.map(post => {
            return div(
              { className: 'post' },
              dom.h1(null,
                     Link({ to: 'post',
                            params: { post: post.shorturl }},
                          post.title)),
              div({ className: 'date' }, displayDate(post.date)),
              dom.p({ dangerouslySetInnerHTML: { __html: post.abstract }})
            );
          }),
          div({ className: 'right-link' },
              Link({ to: 'archive'}, 'View All Posts'))
        ),
        div(
          { className: 'static-content',
            dangerouslySetInnerHTML: { __html: statics.projectsHTML }}
        )
      ),
      div({ className: 'additional-footer attribute' },
          div({ className: 'additional-footer-inner-ugh' },
              'Header image derived with permission from Steve Gildea, ',
              a({ href: 'http://suite3d.com/' }, 'suite3d.com'))),
      Footer()
    )
  }
});

module.exports = Index;
