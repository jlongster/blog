---
tags: ["react","macros"]
published: true
date: "July 2, 2014"
readnext: "Removing-User-Interface-Complexity,-or-Why-React-is-Awesome"
abstract: "<a href=\"http://facebook.github.io/react/docs/jsx-in-depth.html\">JSX</a> is a Facebook project that embeds an XML-like language in JavaScript, and is typically used with <a href=\"http://facebook.github.io/react/\">React</a>. Many people love it and find it highly useful. Unfortunately it requires its own compiler and doesn't mix with other language extensions. I have implemented a <a href=\"https://github.com/jlongster/jsx-reader\">JSX \"compiler\"</a> with <a href=\"http://sweetjs.org/\">sweet.js</a> macros, so you can use it alongside any other language extensions implemented as macros."
shorturl: "Compiling-JSX-with-Sweet.js-using-Readtables"
headerimg: ""
---

# Compiling JSX with Sweet.js using Readtables

[JSX](http://facebook.github.io/react/docs/jsx-in-depth.html) is a Facebook project that embeds an XML-like language in JavaScript, and is typically used with [React](http://facebook.github.io/react/). Many people love it and find it highly useful. Unfortunately it requires its own compiler and doesn't mix with other language extensions. I have implemented a [JSX "compiler"](https://github.com/jlongster/jsx-reader) with [sweet.js](http://sweetjs.org/) macros, so you can use it alongside any other language extensions implemented as macros.

I have a vision. A vision where somebody can add a feature as complicated as [pattern matching](https://github.com/natefaubion/sparkler) to JavaScript, and all I have to do is install the module to use it. With how far-reaching JavaScript is today, I think this kind of language extensibility is important.

It's not just important for you or me to be able to have something like native [goroutines](https://gobyexample.com/goroutines) or native syntax for [persistent data structures](http://swannodette.github.io/mori/). It's incredibly important that we use features in the wild that could potentially be part of a future ES spec, and become standardized in JavaScript itself. Future JavaScript will be better because of your feedback. We *need* a modular way to extend the language, one that *works*, seamlessly with any number of extensions. 

I'm not going to explain why sweet.js macros are the answer to this. If you'd like to hear more, watch my [JSConf 2014 talk](https://www.youtube.com/watch?v=wTkcGprt5rU) about it. If you are already writing a negative comment about this, please [read this](#concerned) first.

**So why did I implement JSX in sweet.js?** If you use JSX, now you can use it alongside [any other macros available](https://www.npmjs.org/search?q=sweet-macros) with [jsx-reader](https://github.com/jlongster/jsx-reader). Want native syntax for dealing with persistent data structures? Read on...

## The Problem

JSX works like this: XML elements are expressions that are transformed to simple JavaScript objects.

```
var div = <div>
  <h1>{ header }</h1>
</div>;
```

This is transformed into:

```
var div = React.DOM.div(null, React.DOM.h1(null, header));
```

JSX could not be implemented in [sweet.js](http://sweetjs.org/) until this week's release. What made it work? [Readtables](http://sweetjs.org/doc/main/sweet.html#reader-extensions).

I will briefly explain a few things about sweet.js for some technical context. Sweet.js mainly works with tokens, not an AST, which is the only way to get real composable language extensions [*](#thought1). The algorithm is heavily grounded in decades of work done by the Lisp and Scheme communities, particularly [Racket](http://docs.racket-lang.org/).

The idea is that you work on a lightweight tree of tokens, and provide a language for defining macros that expand these tokens. [Specialized pattern matching](http://sweetjs.org/doc/main/sweet.html#rule-macros) and [automatic hygiene](http://sweetjs.org/doc/main/sweet.html#hygiene) make it easy to do really complex expansion, and you get a lot for free like sourcemaps.

The general pipeline looks like this:

* **read** - Takes a string of code and produces a tree of tokens. It disambiguates regular expression syntax, divisions, and all kinds of other fun stuff. You get back a nice tree of tokens that represent atomic pieces of syntax. It's a tree because anything inside a delimiter (one of `{}()[]`) exists as children of the delimiter token.
* **expand** - Takes the token tree and walks through it, expanding any macros that it finds. It looks for macros by name and invokes them with the rest of the syntax. This phase also does quite a bit of *light* parsing, like figuring out if something is a valid expression.
* **parse** - Takes the final expanded tree and generates a real JavaScript AST. Currently sweet.js uses a patched version of esprima for this.
* **generate** - Generate the final JavaScript code from the AST. sweet.js uses escodegen for this.

The `expand` phase essentially adds extensibility to the language parser. This is good for a whole lot of features. There are a few features, like types and modules, that require knowledge of the whole program, and those are better off with an AST somewhere in between the `parse` and `generate` phase. Currently we don't have extensibility there yet.

There are very rare features that require extensibility to the `read` phase, and JSX is one of them. Lisp has had something called **readtables** for a long time, and I recently realized that we needed something like that in sweet.js in order to support JSX. So I [implemented](https://github.com/mozilla/sweet.js/pull/340) it!

There are a few reasons JSX needs to work as a reader and not a macro:

1. Most importantly, the closing tag `</name>` is completely invalid JavaScript syntax. The default reader thinks it's starting a regular expression but it can't find the end of it, so it just errors in the `read` phase.
2. JSX has very specific rules about whitespace handling. Whitespace inside elements needs to be preserved, and a space is added between sibling expressions, for example. Macros don't know anything about whitespace.

Reader extensions allow you install a custom reader that is invoked when a specific character is encountered in the source. You can read as much of the source as you need, and return a list of tokens. Reader extensions can only be invoked on punctuators (symbols like `<` and `#`), so you can't do awful things like change how quotes are handled.

A readtable is a mapping of characters to reader extensions. Read more about how this works in [here](http://sweetjs.org/doc/main/sweet.html#reader-extensions) in the docs.

<div class="note" id="thought1">
* I have a lot more opinions about this which I will expand in future posts. Working with ASTs are great for features requiring whole programs, like types or optimization passes. <a href="http://blog.fogus.me/2012/04/25/the-clojurescript-compilation-pipeline/">Read this</a> for a great explanation about these ideas.
</div>
 
## Available on npm: jsx-reader

Now that we have readtables, we can implement JSX! I have done exactly that with [jsx-reader](https://github.com/jlongster/jsx-reader). It is a literal port of the JSX compiler, with all the whitespace rules and other edge cases kept in tact (hopefully).

To load a reader extension, pass the module name to the sweet.js compiler `sjs` with the `-l` flag. Here are all the steps you need to expand a file with JSX:

```shell
$ npm install sweet.js
$ npm install jsx-reader
$ sjs -l jsx-reader file.js
```

Of course, you can load any other macro with `sjs` as well and use it within your file. That's the beauty of composable language extensions. (Try out [es6-macros](https://github.com/jlongster/es6-macros).)

I have also created a [webpack loader](https://github.com/jlongster/sweetjs-loader) and a [gulp loader](https://github.com/jlongster/gulp-sweetjs) that is up-to-date that supports readtable loading.

**This is beta software**. I have tested it across the small test cases that the original JSX compiler includes, in addition to many large files, and it works well. However, there are likely small bugs and edge cases which need to be fixed as people discover them.

Not only do you get **reliable sourcemaps** (pass `-c` to `sjs`), but you also get better error messages than the original JSX compiler. For example, if you forget to close a tag:

```
var div = <div>
    <h1>Title</h1>
    <p>
</div>
```

You get a nice, clean error message that directly points to the problem in your code:

```
SyntaxError: [JSX] Expected corresponding closing tag for p
4: </div>
     ^
    at Object.readtables.readerAPI.throwSyntaxError (/Users/james/tmp/poop/node_modules/sweet.js/lib/parser.js:5075:23)
```

One downside is that this will be slower than the original JSX compiler. A large file with 2000 lines of code will take ~.7s to compile (excluding warmup time, since you'll be using a watcher in almost all projects), while the original compiler takes ~.4s. In reality, it's barely noticeable, since most files are a lot smaller and things compile in a matter of a couple hundred milliseconds most of the time. Also, sweet.js will only get more optimized with time.

### Example: Persistent Data Structures

React works even better when using persistent data structures. The problem is that JavaScript doesn't have them natively, but luckily libraries like [mori](http://swannodette.github.io/mori/) are available. The problem is that you can't use object literals anymore; you have to do things like `mori.vector(1,2,3)` instead of `[1,2,3]`.

What if we implement literal syntax for mori data structures? Potentially you could use `#[1, 2, 3]` to create persistent vectors, and `#{x: 1, y: 2}` to create persistent maps. That would be awesome! (Unfortunately, I haven't actually done this yet, but I want to.)

Now everyone using JSX will be able to use my literal syntax for persistent data structures with React. That is truly a powerful toolkit.

## The JSX Read Algorithm

Adding new syntax to JavaScript, especially a feature with a large surface area like JSX, must be done with great care. It has to be 100% backwards-compatible, and done with future ES.next features in mind.

Both jsx-reader and the original JSX compiler look for the `<` token and trigger a JSX expression parse. There's a key difference though. You may have noticed that jsx-reader, as a reader, is invoked from the raw source and has no context. The original JSX compiler monkeypatches esprima to invoke `<` only when parsing an expression, so it is easier to guarantee correct parsing. `<` is never valid in expression position in JavaScript, so it can get away with it.

jsx-reader is invoked on `<` whenever it occurs in the source, even if it's a comparison operator. That sounds scary, and it is; we need to be very careful. But I have figured out a read algorithm that works. You don't always need a full AST.

jsx-reader begins parsing `<` and anything after it as a JSX expression, and if it finds something unexpected at certain points, it bails. For the most part, it's able to figure out extremely early whether or not `<` is really a JSX expression or not. Here's the algorithm:

1. Read `<`
1. Read an identifier. If that fails, bail.
1. If a `>` is *not* next:
    1. Skip whitespace
    1. Read an identifier. If that fails, bail.
    1. If a `>` is next, go to 4.1
    1. Read `=`
    1. If a `{` is next, read a JS expression similar to 4.3.1
    1. If a `<` is next, go to 1
    1. Otherwise, read a string literal
    1. If a `>` is next, go to 4.1
    1. Otherwise, go to 3.1
1. Otherwise:
    1. Read `>`
    1. Read any raw text up until `{` or `<`
    1. If a `{` is next:
        1. Read `{`
        1. Read all JS tokens up until `}`
        1. Read `}`
        1. Go to 4.2
    1. If a `<` is next:
        1. If a `<` and `/` is next, go to 5
        1. Otherwise, go to 1
    1. If at end of file, bail.
1. Read `<`
1. Attempt to read a regular expression. If that succeeds, bail.
1. Read `/`
1. Read an identifier. Make sure it matches opening identifier.
1. Read `>`

I typed that out pretty fast, and there's probably a better way to format it, but you get the idea. The gist is that it's easy to disambiguate the common cases, but all the edge cases should work too. The edge cases aren't very performant, since our reader could do a bunch of work and then trash it, but though should never happen in 99.9% of code.

In our algorithm, if we say `read` without a corresponding "if it fails, bail", it throws an error. We can still give the user good errors while disambiguating the edge cases of JavaScript.

Here are a few cases where our reader bails:

* `if(x < y) {}` - it bails because it looks for an attribute after `y`, and `)` is not a valid identifier character
* `if(x < y > z) {}` - it bails because it reads all the way to the end of the file and doesn't find a closing block. This only happens with top-level elements, and is the worst case performance-wise, but `x < y > z` doesn't do what you think it does and nobody ever does that.
* `if(x < div > y < /foo>/) {}` - this is the most complicated case, and is completely valid JavaScript. It bails because it reads a valid regex at the end.
 
We take advantage of the fact that expressions like `x < y foo` don't make sense in javascript. Here, it looks for either a `=` to parse an attribute or a `>` to close the element, and errors if it doesn't find it.

<a id="concerned"></a>
## Are You Concerned?

Macros invoke mixed feelings in some people, and many are hesitant to think they are a good thing to use. You may think this, and argue that things like readtables are signs that we have gone off the deep end.

I ask that you think hard about [sweet.js](http://sweetjs.org/). Give it 5 minutes. Maybe give it a couple of hours. Play around with it: set up a gulp watcher, install some macros from npm, and use it. Don't push back against it unless you actually understand the problem we are trying to solve. Many arguments that people give don't make sense (but some of them do!).

Regardless, even if you think this isn't the right approach, it's certainly a *valid* one. One of the most troubling things about the software industry to me is how vicious we can be to one another, so please be constructive.

Give [jsx-reader](https://github.com/jlongster/jsx-reader) a try today, and please [file bugs](https://github.com/jlongster/jsx-reader/issues) if you find any!
