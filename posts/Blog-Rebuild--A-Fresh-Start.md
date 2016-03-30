---
tags: ["blog","rebuild"]
published: true
date: "July 30, 2014"
readnext: ""
abstract: "I wrote my own blogging engine for jlongster.com two years ago, and it has served me well. The code is old and the cracks are showing, however, so I'm going to rewrite it completely with new web technologies and blog throughout development."
shorturl: "Blog-Rebuild--A-Fresh-Start"
headerimg: ""
---

# Blog Rebuild: A Fresh Start

About two years ago I wanted to start blogging more seriously, focusing on in-depth tech articles and tutorials. Since then I've successfully made several posts like the one about [games](http://jlongster.com/Making-Sprite-based-Games-with-Canvas) and another about [react.js](http://jlongster.com/Removing-User-Interface-Complexity,-or-Why-React-is-Awesome).

I decided to write my own blog from scratch to provide a better blogging experience, and it has served me well. I didn't want something big and complicated to maintain like Wordpress, and I had used static generators before but in my opinion you sacrifice a lot, and there's too much friction for writing and updating posts.

Back then I wanted to learn more about node.js, redis, and a few other things. So I wrote a basic redis-backed node.js blogging engine. In a few months (working here and there), I had a site with all the basic blog pages, a markdown editor with live preview, autosaving, unpublished drafts, tags, and some basic layout options. Here is the current ugly editor:

[![](http://jlongster.com/s/blog-editor.png)](http://jlongster.com/s/blog-editor.png)

Redis is an in-memory data store, and node handles multiple connections well by default, so my simple site scales really well. I've have posts reach #1 on hacker news with ~750 visitors at the same time for hours (reaching about 60,000 views) with no problem at all. It may also help that my linode instance has 8 cores and I load up 4 instances of node to serve the site.

You may wonder why I don't just use something like [ghost](https://ghost.org/), a modern blogging platform already written in node. I tried ghost for a while but it's early software, includes complex features like multiple users which I don't need, and most importantly it was too difficult to implement my ideas. This is the kind of thing where I really want my site to be *my* code; it's my area to play, my grand experiment. For me, it's been working out really well (check out [all of my posts](http://jlongster.com/archive)).

But the cracks are showing. The code is JavaScript as I wrote it 2 years ago: ugly callbacks, poor modularity, no tests, random jQuery blobs to make the frontend work, and more. The site is stable and writing blog posts works, but implementing new features is pretty much out of the question. Since this is my site and I can do whatever I want, I'm going to commit the [cardinal sin](http://www.joelonsoftware.com/articles/fog0000000069.html) and rewrite it from scratch.

I've learned a *ton* over the past two years, and I'm really excited to try out some new techniques. I have a lot of the infrastructure set up already, which uses the following software:

* [react](http://facebook.github.io/react/) &mdash; for building user interfaces seamlessly between client/server
* [react-router](https://github.com/rackt/react-router/) &mdash; advanced route handling for react components
* [js-csp](https://github.com/ubolonton/js-csp) &mdash; CSP-style channels for async communication
* [mori](http://swannodette.github.io/mori/) &mdash; persistent data structures
* [gulp](http://gulpjs.com/) &mdash; node build system
* [webpack](http://webpack.github.io/) &mdash; front-end module bundler
* [sweet.js](http://sweetjs.org/) &mdash; macros
* [es6-macros](https://github.com/jlongster/es6-macros) &mdash; several ES6 features as macros
* [regenerator](https://github.com/facebook/regenerator) &mdash; compile generators to ES5

Check out the new version of the site at [new.jlongster.com](http://new.jlongster.com). You can see my progress there (right now it's just a glimpse of the current site). I will put it up on github soon.

I thought it would also be interesting to blog throughout the development process. I'm using some really interesting libraries in ways that are very new, so I'm eager to dump my thoughts quite often. You can expect a post a week, explaining what I worked on and how I'm using a library in a certain way. It will touch on everything such as build systems and cross-compiling, testing, front-end structuring. Others might learn something new as well.

Next time, I'll talk about build systems and cross-compiling infrastructure. See you then!