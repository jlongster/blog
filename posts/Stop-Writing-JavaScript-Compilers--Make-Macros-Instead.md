---
tags: ["js","macros"]
published: true
date: "January 7, 2014"
readnext: "Making-Sprite-based-Games-with-Canvas"
abstract: "JavaScript is everywhere, but that's a double-edged sword. It's hard for everyone involved to agree on how the language should move forward, let alone implement changes in all implementations. Some people write compilers to implement extensions, but that's bad. sweet.js is a new project that implements macros for JavaScript, and it's much better way to implement language extensions."
shorturl: "Stop-Writing-JavaScript-Compilers--Make-Macros-Instead"
headerimg: "http://jlongster.com/s/post-headerimgs/postbg-macro1.png"
---

# Stop Writing JavaScript Compilers! Make Macros Instead

The past several years have been kind to JavaScript. What was once a mediocre language plagued with political stagnation is now thriving with an incredible platform, a massive and passionate community, and a working standardization process that moves quickly. The web is the main reason for this, but node.js certainly has played its part.

ES6, or [Harmony](http://wiki.ecmascript.org/doku.php?id=harmony:proposals), is the next batch of improvements to JavaScript. It is near finalization, meaning that all interested parties have mostly agreed on what is accepted. It's more than just a new standard; Chrome and Firefox have already implemented a lot of ES6 like generators, let declarations, and more. It really is happening, and the process that ES6 has gone through will pave the way for quicker, smaller improvements to JavaScript in the future.

There is much to be excited about in ES6. But the thing I am most excited about is not in ES6 at all. It is a humble little library called [sweet.js](https://github.com/mozilla/sweet.js).

Sweet.js implements macros for JavaScript. Stay with me here. Macros are widely abused or badly implemented so many of you may be in shock right now. Is this really a good idea?

Yes, it is, and I hope this post explains why.

## Macros Done Right

There are lots of different notions of "macros" so let's get that out of the way first. When I say macro I mean the ability to define small things that can syntactically parse and transform code around them.

C calls these strange things that look like `#define foo 5` macros, but they really aren't macros like we want. It's a bastardized system that essentially opens up a text file, does a search-and-replace, and saves. It completely ignores the actual structure of the code so they are pointless except for a few trivial things. Many languages copy this feature and claim to have "macros" but they are extremely difficult and limiting to work with.

Real macros were born from Lisp in the 1970's with [defmacro](http://www.ai.mit.edu/projects/iiip/doc/CommonLISP/HyperSpec/Body/mac_defmacro.html) (and these were based on decades of previous research, but Lisp popularized the concept). It's shocking how often good ideas have roots back into papers from the 70s and 80s, and even specifically from Lisp itself. It was a natural step for Lisp because Lisp code has exactly the same syntax as its data structures. This means it's easy to throw data and code around and change its meaning.

Lisp went on to prove that macros fundamentally change the ecosystem of the language, and it's no surprise that newer languages have worked hard to include them.

However, it's a whole lot harder to do that kind of stuff in other languages that have a lot more syntax (like JavaScript). The naive approach would make a function that takes an AST, but ASTs are really cumbersome to work with, and at that point you might as well just write a compiler. Luckily, a lot of research recently has solved this problem and real Lisp-style macros have been included in newer languages like [julia](http://docs.julialang.org/en/latest/manual/metaprogramming/) and [rust](http://static.rust-lang.org/doc/0.6/tutorial-macros.html).

And now, [JavaScript](https://github.com/mozilla/sweet.js).

## A Quick Tour of Sweet.js

This post is not a tutorial on JavaScript macros. This post intends to explain how they could radically improve JavaScript's evolution. But I think I need to provide a little meat first for people who have never seen macros before.

Macros for languages that have a lot of special syntax take advantage of pattern matching. The idea is that you define a macro with a name and a list of patterns. Whenever that name is invoked, at compile-time the code is matched and expanded.

```js
macro define {
    rule { $x } => {
        var $x
    }

    rule { $x = $expr } => {
        var $x = $expr
    }
}

define y;
define y = 5;
```

The above code [expands to](http://sweetjs.org/browser/editor.html#%0Amacro%20define%20{%0A%20%20%20%20rule%20{%20$x%20}%20=%3E%20{%0A%20%20%20%20%20%20%20%20var%20$x%0A%20%20%20%20}%0A%20%20%20%20%0A%20%20%20%20rule%20{%20$x%20=%20$expr%20}%20=%3E%20{%0A%20%20%20%20%20%20%20%20var%20$x%20=%20$expr%0A%20%20%20%20}%0A}%0A%0Adefine%20y;%0Adefine%20y%20=%205;):

```js
var y;
var y = 5;
```

when run through the sweet.js compiler.

When the compiler hits `define`, it invokes the macro and runs each `rule` against the code after it. When a pattern is matched, it returns the code within the `rule`. You can bind identifiers & expressions within the matching pattern and use them within the code (prefixed with `$`) and sweet.js will replace them with whatever was matched in the original pattern.

We could have written a lot more code within the `rule` for more advanced macros. However, you start to see a problem when you actually use this: if you introduce new variables in the expanded code, it's easy to clobber existing ones. For example:

```js
macro swap {
    rule { ($x, $y) } => {
        var tmp = $x;
        $x = $y;
        $y = tmp;
    }
}

var foo = 5;
var tmp = 6;
swap(foo, tmp);
```

`swap` looks like a function call but note how the macro actually matches on the parentheses and 2 arguments. It might be expanded into this:

```js
var foo = 5;
var tmp = 6;
var tmp = foo;
foo = tmp;
tmp = tmp;
```

The `tmp` created from the macro collides with my local `tmp`. This is a serious problem, but macros solve this by implementing [hygiene](http://en.wikipedia.org/wiki/Hygienic_macro). Basically they track the scope of variables during expansion and rename them to maintain the correct scope. Sweet.js fully implements hygiene so it never generates the code you see above. It would actually generate this:

```js
var foo = 5;
var tmp$1 = 6;
var tmp$2 = foo;
foo = tmp$1;
tmp$1 = tmp$2;
```

It looks a little ugly, but notice how two different `tmp` variables are created. This makes it extremely powerful to create complex macros elegantly.

But what if you want to *intentionally* break hygiene? Or what you want to process certain forms of code that are too difficult for pattern matching? This is rare, but you can do this with something called `case` macros. With these macros, actual JavaScript code is run at expand-time and you can do anything you want.

```js
macro rand {
    case { _ $x } => {
        var r = Math.random();
        letstx $r = [makeValue(r)];
        return #{ var $x = $r }
    }
}

rand x;
```

The above would [expand to](http://sweetjs.org/browser/editor.html#%0A%0Amacro%20rand%20{%0A%20%20%20%20case%20{%20_%20$x%20}%20=%3E%20{%0A%20%20%20%20%20%20%20%20var%20r%20=%20Math.random%28%29;%0A%20%20%20%20%20%20%20%20return%20withSyntax%28$r%20=%20[makeValue%28r%29]%29%20{%0A%20%20%20%20%20%20%20%20%20%20%20%20return%20#{%20var%20$x%20=%20$r%20};%0A%20%20%20%20%20%20%20%20}%0A%20%20%20%20}%0A}%0A%0Arand%20x;%0A%0A%0A%0A%0A%0A):

```js
var x$246 = 0.8367501533161177;
```

Of course, it would expand to a different random number every time. With case macros, you use `case` instead of `rule` and code within the `case` is run at expand-time and you use `#{}` to create "templates" that construct code just like the `rule` in the other macros. I'm not going to go deeper into this now, but I will be posting tutorials in the future so [follow my blog](http://feeds.feedburner.com/jlongster) if you want to here more about how to write these.

These examples are trivial but hopefully show that you can hook into the compilation phase easily and do really powerful things.

## Macros are modular, Compilers are not!

One thing I like about the JavaScript community is that they aren't afraid of compilers. There are a wealth of libraries for parsing, inspecting, and transforming JavaScript, and people are doing awesome things with them.

Except that doesn't really work for extending JavaScript.

Here's why: it splits the community. If project A implements an extension to JavaScript and project B implements a different extension, I have to choose between them. If I use project A's compiler to try to parse code from project B, it will error.

Additionally, each project will have a completely different build process and having to learn a new one every time I want to try out a new extension is terrible (the result is that fewer people try out cool projects, and fewer cool projects are written). I use Grunt, so every damn time I need to write a grunt task for a project if one doesn't exist already.

<div class="note"><span>Note:</span> Maybe you are somebody that doesn't like build steps at all. I understand that, but I would encourage you to get over that fear. Tools like <a href="http://gruntjs.com/">Grunt</a> make it easy to automatically build on change, and you gain a lot by doing so. </div>

For example, [traceur](http://code.google.com/p/traceur-compiler/) is a really cool project that compiles a lot of ES6 features into simple ES5. However, it only has limited support for generators. Let's say I wanted to use [regenerator](https://github.com/facebook/regenerator) instead, since it's much more awesome at compiling `yield` expressions.

I can't reliably do that because traceur might implement ES6 features that regenerator's compiler doesn't know about.

Now, for ES6 features we kind of get lucky because it is a standard and compilers like [esprima](http://esprima.org/) have included support for the new syntax, so lots of projects will recognize it. But passing code through multiple compilers is just not a good idea. Not only is it slower, it's not reliable and the toolchain is incredibly complicated.

The process looks like this:

![](http://jlongster.com/s/posts/macro1.png)

I don't think anyone is actually doing this because it doesn't compose. The result is that we have big monolothic compilers and we're forced to choose between them.

Using macros, it would look more like this:

![](http://jlongster.com/s/posts/macro2.png)

There's only one build step, and we tell sweet.js which modules to load and in what order. sweet.js registers all of the loaded macros and expands your code with all them.

You can setup an ideal workflow for your project. This is my current setup: I configure grunt to run sweet.js on all my server-side and client-side js (see my [gruntfile](https://gist.github.com/jlongster/8045898)). I run `grunt watch` whenever I want to develop, and whenever a change is made grunt compiles that file automatically with sourcemaps. If I see a cool new macro somebody wrote, I just `npm install` it and tell sweet.js to load it in my gruntfile, and it's available. Note that for *all* macros, good sourcemaps are generated, so debugging works naturally.

This could potentially loosen the shackles of JavaScript to legacy codebases and a slow standardization process. If you can opt-in to language features piecemeal, you give the community a lot of power to be a part of the conversation since they can make those features.

Speaking of which, ES6 is a great place to start. Features like destructuring and classes are purely syntactical improvements, but are far from widely implemented. I am working on a [es6-macros](https://github.com/jlongster/es6-macros) project which implements a lot of ES6 features as macros. You can pick and choose which features you want and start using ES6 today, as well as any other macros like [Nate Faubion](https://github.com/natefaubion/)'s execellent [pattern matching library](https://github.com/natefaubion/sparkler).

<div class="note"><span>Note:</span> sweet.js does not support ES6 modules yet, but you can give the compiler a list of macro files to load. In the future, you will be able to use the ES6 module syntax in the files to load specific modules.</div>

A good example of this is in Clojure, the [core.async](https://github.com/clojure/core.async) library offers a few operators that are actually macros. When a `go` block is hit, a macro is invoked that completely transforms the code to a state machine. They were able to implement something similar to generators, which lets you pause and resume code, as a library because of macros (the core language doesn't know anything about it).

Of course, not everything can be a macro. The ECMA standardization process will always be needed and certain things require native implementations to expose complex functionality. But I would argue that a large part of improvements to JavaScript that people want could easily be implemented as macros.

That's why I'm excited about [sweet.js](http://sweetjs.org/). Keep in mind it is still in early stages but it is actively being worked on. I will teach you how to write macros in the next few blog posts, so please [follow my blog](http://feeds.feedburner.com/jlongster) if you are interested.

(Thanks to [Tim Disney](https://twitter.com/disnet) and [Nate Faubion](https://twitter.com/natefaubion) for reviewing this)
