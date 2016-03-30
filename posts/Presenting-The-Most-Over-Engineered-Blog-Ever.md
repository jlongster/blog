---
abstract: "Several months ago <a href=\"http://jlongster.com/Blog-Rebuild--A-Fresh-Start\">I posted</a> about plans to rebuild this blog. After a few false starts, I finally finished and launched the new version two weeks ago. The new version uses React and is way better (and I <a href=\"https://github.com/jlongster/blog\">open-sourced it</a>)."
shorturl: "Presenting-The-Most-Over-Engineered-Blog-Ever"
tags: ["blog","rebuild"]
published: true
date: "January 15, 2015"
---

# Presenting The Most Over-Engineered Blog Ever

Several months ago [I posted](http://jlongster.com/Blog-Rebuild--A-Fresh-Start) about plans to rebuild this blog. After a few false starts, I finally finished and launched the new version two weeks ago. The new version uses React and is way better (and I [open-sourced it](https://github.com/jlongster/blog)).

Notably, using React my app is split into components that can all be rendered on the client *or* the server. I have full power to control what gets rendered on each side.

And it feels weird.

It's what people call an "isomorphic" app, which is a fancy way of saying that generally I don't have to think about the server or the client when writing code; it just works in both places. When we finally got JavaScript on the server, this is what everyone dreamed about, but until React there hasn't been a great way to realize this.

I *really* enjoyed this exercise. I was so embedded with the notion that the server and client are completely separate that it was **awkward** and **weird** for a while. It took me while to figure out how to even structure my project. Eventually, I learned something new that will greatly impact all of my future projects (which is the best kind of learning!).

If you want to see what it's like logged in, I setup a demo site, [test.jlongster.com](http://test.jlongster.com/), which has admin access. You can test things like my [simple markdown editor](http://test.jlongster.com/edit/ulla-nec-dui-vulputate,-ut-facilisis-nulla-pla).

Yes, this *is* just a blog. Yes, this is absolutely over-engineering. But it's fun, and I learned. If we can't even over-engineer our own side projects, well, I just don't want to live in that world.

This is quick post-mortem of my experience and some explanation of how it works. The [code](https://github.com/jlongster/blog) is up on github, but beware it is still quite messy as I did all of this in a small amount of time.

One thing I should note is that I use [js-csp](https://github.com/ubolonton/js-csp) (soon to be renamed) channels for all my async work. I find this to be the best way to do anything asynchronous, and you can read [my article](http://jlongster.com/Taming-the-Asynchronous-Beast-with-CSP-in-JavaScript) about it if interested.

## The Server & Client Dance

You might be wondering why this is so exciting, since we've been rendering complex pages statically from the server and hooking them up on the client-side for ages. The problem is that you used to have to write code completely separately, one file for the server and one for the client, even though your describing the same components/behaviors/what have you. That turns out to be a disaster for complex apps (hence the push for fully client-side apps that pull data from APIs).

Unfortunately, full client-side apps (or "single page apps") suffer from slow startup time and lack of discoverability from search engines.

We really want to write components that aren't bound to either the server or the client. And React lets us do that:

```js
let dom = React.DOM;

let Toolbar = React.createClass({
  load: function() {
    // loading functionality...
  },

  render: function() {
    return dom.div(
      { className: 'toolbar' },
      dom.button({ onClick: this.load }, 'Load' })
    );
  }
});
```

This looks like a front-end component, but it's super simple to render on the back-end: `React.renderToString(Toolbar())`, which would return something like `<div class="toolbar"><button>Load</button></div>`. The coolest part is when the browser loads the rendered HTML, you can just do `React.render(Toolbar(), element)`, and React *won't touch the DOM* except to simply hook up your event handlers (like the `onClick`). `element` would be the DOM element wherever the toolbar was prerendered.

It's not that hard to build a workflow on top of this that can *fully prerender* a complex app so that it loads instantly on the client, but additionally all the event handlers get hooked up appropriately. To do this, you do need to figure out how to specify data dependencies so that the server can pull in everything it needs to render (see later sections), but there are libraries to help with this. I'm never doing `$('.date-picker').datePicker()` again, but I'm also not bound to a fully client-side technology like Web Components or Angular (Ember is [finally](http://emberjs.com/blog/2014/12/22/inside-fastboot-the-road-to-server-side-rendering.html) working on server-side rendering).

Full prerendering is nice, but you probably don't need quite all of that. Most likely, you want to prerender some of the basic structure, but let the client-side pull in the rest. The beauty of React's component approach is that it's easy (once you have server-side rendering going with routes & data dependencies) to fine-tune precisely *what* gets rendered *where*. Each component can configure itself to be server-renderable or not, and the client basically picks up wherever the server left off. It depends on how you set it up, so I won't go into detail about it, but I certainly felt empowered with control to fine-tune everything.

Not to mention that anything server renderable is easily testable!

## A Quick Glance at Code

React provides a great infrastructure for server-rendering, but you need a lot more. You need to be able to run the same routes server-side and figure out which data your components need. This is where [react-router](https://github.com/rackt/react-router) comes in. This is the critical piece for complex React apps.

It's a great router for the client-side, but it also provides the pieces for server-rendering. For my blog, I specify the routes in [routes.js](https://github.com/jlongster/blog/blob/master/src/routes.js#L24), and the router is run in the [bootstrap file](https://github.com/jlongster/blog/blob/master/src/bootstrap.js#L44). The server and client call this `run` function. The router tells me the components that are required for the specific URL.

For data handling, I copied an approach from the react-router [async data](https://github.com/rackt/react-router/tree/master/examples/async-data) example. Each component can define a `fetchData` static method, and you can see also in the bootstrap file [a method](https://github.com/jlongster/blog/blob/master/src/bootstrap.js#L8) to run through all the required components and gather all the data from these methods. It attaches the fetched data as a [property to each component](https://github.com/jlongster/blog/blob/master/src/components/post.js#L38).

**This is simplistic**. More complex apps use an architecture like [Flux](http://facebook.github.io/flux/). I'm not entirely happy with the `fetchData` approach, but it works alright for small apps like a blog. The point here is that you have the infrastructure to do this without a whole lot of work.

## Ditching Client-Side Page Transitions

With this setup, instead of refreshing the entire page whenever you click a link, it can just fetch any new data it needs and only update parts of the page that need to be changed. `react-router` especially helps with this, as it takes care of all of the `pushState` work to make it feel like the page actually changed. This makes the site pretty snappy.

Although it feels a little weird to do that for a blog, I had it working at one point. The page never refreshed; it only fetched data over XHR and updated the page contents. In fact, I enabled that mode on the demo site, [test.jlongster.com](http://test.jlongster.com/), so you can play with it there.

I ended up disabling it though. The main reason is that many of my demos mutate the DOM directly, so you couldn't reliably enter and leave a post page, as there would be side effects. In general, I realized that it was just too much work for a simple blog. I'm really glad I learned how to set this up, but rendering everything on the sever is nice and simple.

It turns out that **writing React server apps is completely awesome**. I didn't expect to end up here, but think about it, I'm writing in React but my whole site acts as if it were a site from the 90s where a request is made, data is fetched, and HTML is rendered. **Rendering transitions on the client without refreshing the page is just an optimization**.

There is a still a React piece on the client which "renders" each page, but all it is doing is hooking up all the event handlers.

## Implementation Notes

Here's a few more details about how everything works.

### Folder Structure

The [`src`](https://github.com/jlongster/blog/tree/master/src) folder is the core of the app and everything in there can be rendered on the server or the client. The [`server`](https://github.com/jlongster/blog/tree/master/server) folder holds the express server and the API implementation, and the [`static/js`](https://github.com/jlongster/blog/tree/master/static/js) folder holds the client-side bootstrapping code.

Both sides pull in the `src` directory with relative imports, like `require('../src/routes')`. The components within `src` each fetch the data they need, but this needs to work on the client *and* the server. My blog runs everything only on the server now, but I'm discussing apps that support client-side rendering too.

The problem is that components in `src` need to pull in different modules if they are on the server or the client. If they are on the server, they can call API methods directly, but on the client they need to use XHR. I solve this by creating an implementation folder `impl` on the [server](https://github.com/jlongster/blog/tree/master/server/impl) and the [client](https://github.com/jlongster/blog/tree/master/static/js/impl), with the same modules that implement the same APIs. Components can require `impl/api.js` and they will load the right API implementation, as seen [here](https://github.com/jlongster/blog/blob/master/src/components/edit.js#L15).

In node, this require works because I symlink `server/impl` as `impl` in my `node_modules` folder. On the client, I [configure webpack](https://github.com/jlongster/blog/blob/master/webpack.config.js#L17) to resolve the `impl` folder to the client-side implementation. All of the database methods are implemented in the server-side [`api.js`](https://github.com/jlongster/blog/blob/master/server/impl/api.js), and the same API is implemented on the client-side [`api.js`](https://github.com/jlongster/blog/blob/master/static/js/impl/api.js) but it calls the back-end API over XHR.

I tried to munge `NODE_PATHS` at first, but I found the above setup rather elegant.

### Large Static HTML Chunks

There are a couple places on my blog where the content is simply a large static chunk of HTML like the [projects section](https://github.com/jlongster/blog/blob/master/static/projects.html). I don't use [JSX](https://facebook.github.io/react/docs/jsx-in-depth.html), and I didn't really feel like wrapping them up in components anyway. I simply dump this content in the `static` folder and created server and client-side implementations of a [statics.js](https://github.com/jlongster/blog/blob/master/server/impl/statics.js) module that loads in this content. To render it, I just tell React to [load it as raw HTML](https://github.com/jlongster/blog/blob/master/src/components/index.js#L60).

### Gulp & Webpack

I use [6to5](http://6to5.org/) to write ES6 code and compile it to ES5. I set up a gulp workflow to build everything on the server-side, run the app and restart it on changes. For the client, I use webpack to bundle everything together into a single js file (mostly, I use [code splitting](http://webpack.github.io/docs/code-splitting.html) to separate out a few modules into other files). Both run 6to5 on all the code.

I like this setup, but it does feel like there is duplicate work going on. It'd be nice to somehow use webpack for node modules too, and only have a single build process.

### Ansible/Docker

In addition to all of this, I completely rebuilt my server and now use [ansible](http://www.ansible.com/home) and [docker](https://www.docker.com/). Both are amazing; I can use ansible to bootstrap a new machine and then docker to run any number of apps on it. This deserves its own post.

I told you I over-engineered this right?!

## Todo

My new blog was an exercise in how to write React apps that blend the server/client distinction. As its my first app of this type, it's quite terrible in some ways. There's a lot of things I could clean up, so don't focus on the details.

I think the overall structure is pretty sound, however. A few things I want to improve:

* Testing. Right now I only test the server-side API. I'd like to learn slimerjs and how to integrate it with mocha.
* Data dependencies. The `fetchData` method on components was a good starting point, but I think it's a little awkward and it would probably be good to have very basic Flux-style stores instead.
* Async. I also used this as an excuse to try [js-csp](https://github.com/ubolonton/js-csp) on a real project, and it was quite wonderful. But I also saw some glaring sore spots and I'm going to fix them.
* Cleanup. Many of the utility functions and a few other things are still from my old code, and are pretty ugly.

I hope you learned something. I know I had fun.