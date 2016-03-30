---
published: true
shorturl: "Tilt-This"
tags: []
date: "April 3, 2012"
---

# Tilt This

Firefox's [Tilt web inspector](http://hacks.mozilla.org/2011/12/new-developer-tools-in-firefox-11-aurora/) is a cool developer tool for viewing a 3d representation of a webpage. This is a great to quickly scan a page and see how the DOM elements are structured.

![](/img/tilt.png)

Interesting shapes pop out and you can easily identify common patterns across the page. What if you crafted DOM elements specifically to form interesting 3d objects when viewed with Firefox Tilt? You could embed hidden 3d objects on the page!

I built [Tilt This](http://jlongster.com:4000/) to let developers build 3d objects specifically meant to be viewed with Firefox Tilt. The idea is to build an object, publish it, grab the html and embed it somewhere on a real page. The object won't be visible by normal eyes, but when the page is viewed with Firefox Tilt it suddenly pops out.

You can [look at the instructions](http://jlongster.com:4000/instructions) or just go [straight to the editor](http://jlongster.com:4000/)!

*Update: Tilt This has been discontinued. The source can be found [here](https://github.com/jlongster/tilt-this).*