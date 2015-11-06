
# jlongster.com

This is the raw source for my blog, [jlongster.com](http://jlongster.com/). This is where I experiment with new JavaScript libraries. Read [my post](http://jlongster.com/Presenting-The-Most-Over-Engineered-Blog-Ever) for more information.

It's built with react, react-router, redux, and a few other things. It supports server-side rendering with proper HTTP status codes, an admin interface for editing posts, and an API which everything uses. It's a good example project for anything looking for a moderately complex React app.

It does not do inline page updates, meaning it forces a browser refresh for each URL change, but only because my older demos mutate the DOM so I have to do that. A fresh blog could potentially turn on pushState-powered URL changes.

**I have no intention into making this a platform**. This is my site. I will evolve it for my needs. I *will* make backwards incompatible changes, probably big ones especially in the near future. The database structure will generally stay the same though, since I have already have a lot of content in it.

To get running:

* `npm install`
* `cd static/css && ln -s default-theme theme`
* `gulp run`
