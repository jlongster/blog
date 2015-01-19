
# jlongster.com

This is the raw source for my blog, [jlongster.com](http://jlongster.com/). I will fill out this section
more later, but for now you can read [my post](http://jlongster.com/Presenting-The-Most-Over-Engineered-Blog-Ever) about it.

Right now, it supports prerendering a page on the server with React but also letting the client pick up the initial page and render everything within the browser from there (so you could even do page transitions without a full page refresh). I turned it off though, and it now renders everything on the server with a full page refresh, and I will soon be ripping out the client-side rendering. I will tag this version for those interested.

Visit the [demo site](http://test.jlongster.com/) to see client-side page transitions in action. You can also see the admin section and try the [markdown editor](http://test.jlongster.com/edit/ulla-nec-dui-vulputate,-ut-facilisis-nulla-pla).

**I have no intention into making this a platform**. This is my site. I will evolve it for my needs. I *will* make backwards incompatible changes, probably big ones especially in the near future. The database structure will generally stay the same though, since I have already have a lot of content in it.

I open-sourced this mainly because I thought others could learn a few things from it. Eventually it may become more modular so it's easy to version and use with various modules.