---
published: true
shorturl: "How-Apache--"
tags: ["mozilla"]
date: "August 18, 2011"
---

# How Apache & Some Magic Helped Move Mozilla to .org


Over the past couple weeks my teammates at Mozilla have been blogging about our goal to merge our major websites, currently spread across several domains, into the one and only site [mozilla.org](http://mozilla.org). Their posts provide a lot of good history on this project:

* [Moving Towards One Mozilla](http://www.intothefuzz.com/2011/08/10/moving-towards-one-mozilla/) by John Slater
* [Bringing Mozilla Product Sites Back Home to Mozilla.org](http://blog.chrissiebrodigan.com/2011/08/bringing-mozilla-product-sites-back-home-to-mozilla-org-hellz-yeah/) by Chrissie Brodigan
* [Creating regional hubs to support Mozilla's local communities](http://davidwboswell.wordpress.com/2011/08/11/creating-regional-hubs-to-support-mozillas-local-communities/) by David Boswell

John, David, and Chrissie explain the project from the engagement & contributor perspective, but I'm here to explain some of the tech details behind the merge. As the tech lead on the project, I've had to navigate through some rather complex waters and figure out a solution that is simple enough to understand but fits the needs of everyone involved.

Mozilla has a huge network of contributors across the world, and a long and rich history. For this reason, any change has a large impact for Mozilla and its contributors. **Merging websites is a huge change**, and we must minimize the impact of this.

[Mozilla Messaging](http://mozillamessaging.com) has already been merged into mozilla.org, and [Mozilla Europe](http://mozilla-europe.org/) is mostly there. My main focus was on merging [mozilla.com](http://mozilla.com/) and [mozilla.org](http://mozilla.org/). Each of those websites have their own development workflow, community, project owners, etc. How in the world can we merge these sites back into one place? (Historical note: these used be a single site, but were split about 5 years ago).

It's clear that we can't literally merge the codebases for each site into a single SVN-managed codebase. This would be a **huge change** and would *wreak havoc on our localizers*, who already have development version of the sites set up to work on. Not to mention the internal restructuring within Mozilla it would force us to do immediately.

We want to merge everything thoroughly in the future, and that will happen slowly over time. But we can't wait for that to merge our sites, since that might take months or even years. We need to make mozilla.com and mozilla.org *appear* to be running under one domain, even if the projects are separate. Enter Apache.

## Implementing the Merge

[mozilla.com](http://mozilla.com/) and [mozilla.org](http://mozilla.org/) both use PHP, and one of PHP's advantages is dead-simple deployment. We can leverage this and put some magic into Apache to run both sites as one domain.

The idea is simple:

* Use SVN to checkout mozilla.org into the mozilla.com codebase under the /org folder
* Put Apache rewrites in htaccess to load all of mozilla.org's pages as top-level URLs
* Fix URL conflicts and other small bugs
* Serve this new repository at mozilla.org

A few problems fall out of this, but mostly small bugs that can be fixed in how we load the mozilla.org pages. The main problem is that mozilla.org's htaccess file won't be processed, so we need to merge it in to mozilla.com's htaccess. This proved difficult because of performance: mozilla.org had about 1500 redirects which causes a bit of a slowdown.

This was solved during a benchmarking phase which showed that [RewriteMap](http://httpd.apache.org/docs/2.0/mod/mod_rewrite.html#rewritemap) performs quite well for this task (see [Benchmarking](#benchmarking)).

This keeps mozilla.org and mozilla.com as separate projects (even separate SVN repos), but magically served as one domain. Eventually we will merge the projects & communities more permanently, but it will be easier to work towards that with this merge already done.

## Benchmarking

Another complexity with this is performance. Our temporary hack must not incur a performance penalty since we serve millions of users a day.

After worrying about this for a while, I implemented the merge with a few different tweaks and benchmarked the different setups. [Read all about my conclusions here with pretty graphs](https://wiki.mozilla.org/Mozilla.com/2011-Rebranding-Project/Benchmarks) and how I justified that our current solution will perform fine.

Big thanks to [Laura Thomson](http://www.laurathomson.com/), another Mozillian who brought RewriteMap to light when I was complaining about the huge amount of rewrites in our #webdev IRC channel.

## Future

This merge hack is a big step towards our [One Mozilla](http://www.intothefuzz.com/2011/08/10/moving-towards-one-mozilla/) project. It is just temporary, though, and we are working on a new platform for mozilla.org which will serve our needs better. More to come on this soon.

You can track our work on the merge in [this tracking bug](https://bugzilla.mozilla.org/show_bug.cgi?id=610724).

You can see our staging site for the merged site at [http://www-dev.allizom.org/](http://www-dev.allizom.org/). Poke around and let us know if anything is broken!

We will be pushing this hack live this Wednesday, August 24th! Feel free to [contact me](mailto:jlong@mozilla.com) if you have any concerns about it.