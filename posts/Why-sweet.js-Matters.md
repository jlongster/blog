---
tags: ["js","macros"]
published: true
date: "October 26, 2012"
readnext: "Stop-Writing-JavaScript-Compilers--Make-Macros-Instead"
abstract: ""
shorturl: "Why-sweet.js-Matters"
headerimg: ""
---

# Why sweet.js Matters

_(Update Jan. 10, 2014: if you like this post, you should read my much more recent post ["Stop Writing JavaScript Compilers! Make Macros Instead"](http://jlongster.com/Stop-Writing-JavaScript-Compilers--Make-Macros-Instead))_ 

Recently people have been talking about [sweet.js](https://github.com/mozilla/sweet.js), a macro system for javascript. I debated writing this because most arguments for and against it have already been discussed. However, this post may reach new crowds, and macros can be confusing anyway so the more explanation the better.

First off, thanks to Tim Disney and those who have helped develop sweet.js at Mozilla. Disregarding the long-term success of it, it's a very fun and impressive thing to play with.

**Macros allow you extend the language**. There are various implementations of macros that widely differ in how they work, but they all achieve the same affect: given a chunk of source code, expand it into something different and hand it back. They are most popular with Lisp-based languages because the syntax makes macros intuitive. Languages with a lot of syntactic sugar make macros difficult.

That's why sweet.js is great: it finds a comfortable medium between intuitiveness and practicality for Javascript. You can check out some example's of sweet.js at [its website](http://sweetjs.org/). It uses a very specific pattern matching language to express macros.

If you've never used macros, this is different than anything you've done before. Keep that in mind as you look at this project, and give it a chance before dismissing it.

The burning question is: **why would you *want* to extend the language?**

At [Strange Loop](https://thestrangeloop.com/) this year, Brendan Eich said something that made me realize how much potential javascript macros have <sup><a href="#footnote1" class="footnote">[1]</a></sup>. He said something to the effect, "I want macros to succeed so that I can stop worrying about javascript's syntax and work on something else."

The sentiment reflects how hard the ECMAScript committee works to improve javascript and decide new syntax to introduce. It's especially difficult with javascript because *you can't break the web*. Over a decade's worth of javascript must still work with any changes you introduce. Not only that, but several browser vendors have a vested interest. Changes come very slowly and in small pieces.

That means javascript is stuck in basically the same form it was a decade ago. Luckily, [ES6](http://wiki.ecmascript.org/doku.php?id=harmony:proposals), the next version if javascript, is rockin' it and brings a lot of good stuff. Even better, it looks like it will actually be approved sometime soon, meaning *it's real*!

But what happens 10 years from *now*? The slow pace of javascript's evolution can be deadly, and we wouldn't have ES6 without a lot of hard work from a lot of people. And what if you disagree with the new stuff? Why should the ECMAScript committee have to decide every last detail of javascript, one of the most widely used languages?

Macros let us, **every day users of javascript**, mold the language into what we need. It lets us contribute to the evolution of javascript. Imagine patterns emerging out of the javascript community of new syntax implemented with macros that could form the basis for new js features.

For example, a simple feature like variable destructuring is immensely helpful, but takes years to be standardized in javascript. If we had macros, we could simply publish a library to the js community. [Here's the sweet.js macro](https://gist.github.com/3881008) I wrote which lets you do this:

```js
varr [x, y, z] = [0, 1, 2];
console.log(x, y, z); // 0 1 2

varr {x, y, z} = {x: 5, y: 6, z: 7};
console.log(x, y, z); // 5 6 7

varr w = 10;
console.log(w); // 10
```

The macro looks like this:

```js
macro varr {
  case [$var (,) ...] = $expr => {
      var i = 0;
      var arr = $expr;
      $(var $var = arr[i++];) ...
  }

  case {$var (,) ...} = $expr => {
      var obj = $expr;
      $(var $var = obj.$var;) ...
  }

  case $var:ident = $expr => {
      var $var = $expr
  }
}
```

I used `varr` instead of `var` simply because of a bug in sweet.js; in the future you can override keywords.

You might argue that you can do this with a separate precompilation step, and you can. However, there's a world of difference between setting up a precompilation stage and simply including a macro. Imagine being able to simply `require('syntax-extensions');` and you can access all the new syntax. Native support makes it much more accessible.

Democratizing the syntax of a language, especially something so bound to its current implementation like javascript, is a great way to move forward.

## Resources

* Website: http://sweetjs.org/
* Source: https://github.com/mozilla/sweet.js
* Original talk by Tim: https://air.mozilla.org/sweetjs/
* Nice writeup on getting started: http://scriptogr.am/micmath/post/sweet-macros-in-javascript
* Some discussion: http://news.ycombinator.com/item?id=4560691

*[Discuss on Hacker News](https://news.ycombinator.com/item?id=4703288)*

<sup id="footnote1">
[1] State of Javascript: http://www.infoq.com/presentations/State-JavaScript
</sup>