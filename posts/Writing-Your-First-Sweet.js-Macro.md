---
tags: ["js","macros"]
published: true
date: "February 6, 2014"
readnext: "Sweet.js-Tutorial--2--Recursive-Macros-and-Custom-Pattern-Classes"
abstract: "This is the first entry in a series about writing JavaScript macros with <a href=\"http://sweetjs.org/\">sweet.js</a>. You will learn how to write your first macro, basics of pattern matching, and how to run the sweet.js compiler and use sourcemaps for debugging."
shorturl: "Writing-Your-First-Sweet.js-Macro"
headerimg: ""
---

# Writing Your First Sweet.js Macro

This is the first entry in a series about writing JavaScript macros with [sweet.js](http://sweetjs.org/). You will learn how to write your first macro, basics of pattern matching, and how to run the sweet.js compiler and use sourcemaps for debugging.

*All of these tutorials are available in the [sweet.js-tutorials](https://github.com/jlongster/sweet.js-tutorials) repo along with a working environment to build sweet.js macros. The next tutorial is about [recursive macros and pattern classes](http://jlongster.com/Sweet.js-Tutorial--2--Recursive-Macros-and-Custom-Pattern-Classes).*

I recommend you read the [article introducing this series](http://jlongster.com/Stop-Writing-JavaScript-Compilers--Make-Macros-Instead) if you don't know much about sweet.js and JavaScript macros. I meant to get this out way ealier; sorry it took a while. You can follow my blog via [RSS](http://feeds.feedburner.com/jlongster) or [twitter](https://twitter.com/jlongster) to follow this series.

## Meet the Macro Editor

This is the macro editor. You will see this a lot throughout these tutorials, so get familiar with it.

<div class="intro-images top">
<img src="http://jlongster.com/s/posts/sweet-tutorial-1/edit-text-here.png" class="edit-text-here" />
<img src="http://jlongster.com/s/posts/sweet-tutorial-1/output-shown-here.png" class="output-shown-here" />
</div>

<div class="stepping-images top">
<img src="http://jlongster.com/s/posts/sweet-tutorial-1/number-expansions.png" class="number-expansions" />
</div>

<div class="macro-editor" id="tutorial">macro foo {
  rule { $x } => { $x }
}

foo "Hi there!";
foo "Another string";</div>

<div class="intro-images bottom">
<img src="http://jlongster.com/s/posts/sweet-tutorial-1/step-through-expand.png" class="step-through-expand" />
</div>

<div class="stepping-images bottom">
<img src="http://jlongster.com/s/posts/sweet-tutorial-1/run-next.png" class="run-next" />
</div>

You can **interactively edit** the text on the left, and it will automatically expand the code and display the output on the right. A big red message will appear if there are any errors. You can open the stepper to watch how the code is expanded, which will be especially useful in later tutorials.

Below an editor instance, there may be links which change the code when clicked. For example, <a href="#tutorial" data-editor-change="tutorial">click here</a> and see how the above code changes. Press "revert" to restore the original code.

When you want to make large changes to or share a macro, you should work in the [sweet.js editor](http://sweetjs.org/browser/editor.html#macro%20foo%20{%0A%20%20rule%20{%20$x%20}%20=%3E%20{%20$x%20}%0A}) which is better for that.

<div class="note"><span>Note:</span> This tutorial uses sweet.js <span class="sweet-version"></span>. sweet.js is still in early stages so you might hit bugs.</div>

## Let's Get Started

Macros are created with the `macro` keyword. You give it a name and a list of rules for pattern matching.

<div class="macro-editor" id="basic">macro foo {
  rule { $x } => { $x + 'rule1' }
}

foo 5;
foo bar;</div>

Macro names can contain any keyword, identifier, or punctuator. A **punctuator** is a symbol like one of these: `+ - * & ^ % #` and more. The only invalid symbols are `[ ] ( ) { }` which are considered
**delimiters**.

This macro only has 1 rule and it binds the first element to `$x`. It runs the pattern matching on syntax that follows the macro name. When you prefix an identifier with `$`, it captures the element that is matched and you can use it within the template to output whatever was matched. Otherwise, it matches tokens literally like `{` or `}` and anything else you throw at it.

Without the `$`, the macro would match the identifer literally. Go ahead, change `$x` to `x` in the macro above (type it yourself or <a href="#basic" data-editor-change="1">click here</a>). You'll notice that there's a match error. If you want to reset the code in the example, just click "revert" and it'll work again.

However, if we use the macro with a literal `x`, it works (<a href="#basic" data-editor-change="2">click here to try</a>)! But change `x` to anything else and it fails. It's *literally* matching `x` unless we use `$x` which makes it a pattern variable.

<div class="macro-editor" id="examples">// click on a macro below</div>

For fun, try a few other macros:

* <a href="#" data-editor-change="fun1" data-editor-big=1>^</a> - use a punctuator as a macro
* <a href="#" data-editor-change="fun2" data-editor-big=1>var</a> - stupidly simply var destructuring

### Multiple Patterns

Next, let's try adding some more rules and patterns:

<div class="macro-editor" id="multiple-patterns">macro foo {
  rule { => $x } => { $x + 'rule1' }
  rule { [$x] } => { $x + 'rule2' }
  rule { $x } => { $x + 'rule3' }
}

foo => 5;
foo 6;
foo [bar];</div>

Now this is interesting. We can emit different code based on which patterns matched. The first rule matches the token `=>` and then binds whatever comes after it. `foo => 5` correctly matched this pattern and emitted `5 + 'rule1'`. The second rule strips the brackets, and the last catches whatever.

The `=>` happens to be parsed as a single token because ES6 [fat arrow functions](http://wiki.ecmascript.org/doku.php?id=harmony:arrow_function_syntax) use it. But any list of tokens would work, as it will match the full list of tokens, so it could have been `=*>` (<a href="#multiple-patterns" data-editor-change="3">try it!</a>).

**Order of the rules matters**. This is a basic principle of pattern matching that you need to learn. It matches top-down, so more specific patterns need to be above less specific ones. For example, `[$x]` is more specific than `$x`, and if you switch the order of them `foo [bar]` matches the less specific pattern which doesn't strip the brackets (<a href="#multiple-patterns" data-editor-change="4">try it!</a>).

### Pattern Classes

When you use a pattern variable like `$x`, it matches *anything* in that place, whether it's a string, array expression, or whatever. What if you wanted to restrict the type of thing it matches?

You can specify a specific parse class that the variable should bind to. For example `$x:ident` only matches identifiers. There are 3 available classes:

* `expr` - an expression
* `ident` - an identifer
* `lit` - a literal

You may be wondering what's the point of the `expr` class, since an expression could be anything. By default, sweet.js is not greedy. It will find the minimal syntax that matches a pattern. If you tried to match `$x` with `bar()`, `$x` would only be bound to the identifier `bar`. However, if you force it to be an expression, `$x:expr` will bind to the whole expression `bar()`.

Pattern classes are also useful for better errors; if you have restricted the pattern to match exactly what you want, you'll get good match errors when something's wrong.

<div class="macro-editor" id="pattern-classes">macro foo {
  rule { $x:lit } => { $x + 'lit' }
  rule { $x:ident } => { $x + 'ident' }
  rule { $x:expr } => { $x + 'expr' }
}

foo 3;
foo "string";
foo bar;
foo [1, 2, 3];
foo baz();</div>

`3` and `"string"` matched as `lit`, and `bar` matched as `ident`. An identifer is any valid JavaScript variable name, and a literal is any constant number or string.

The array matched as an expression, which is correct. However, what's up with `baz()`? As mentioned before, sweet.js is not greedy, and it matches just `baz` instead. Especially in this case, since we have a pattern `$x:ident` which is higher precedence than `$x:expr`, which explicitly says to just match the identifier `baz`. Even if we didn't use classes, we would have this problem (<a href="#pattern-classes" data-editor-change="5">try for yourself!</a>).

If we really want to match the whole expression, we need to use `$x:expr` and it needs to be above other rules (<a href="#pattern-classes" data-editor-change="6">try it!</a>). At this point, it doesn't really make sense to have any rules below it, since `$x:expr` will match identifiers and literals as well.

If you ever really want to match a full expression, you should always use the `expr` class on pattern variables.

### Recursive Macros and `let`

Macros expand recursively, which means sweet.js expands the code again after your macro is run. You will find this behavior very useful in more advanced macros that use several expansion steps to transform code. This lets you match one rule, and emit code to run the macro again to match a different rule. You will see this more later in the advanced tutorials.

<div class="macro-editor" id="recursive-macros">macro foo {
  rule { { $expr:expr } } => {
    foo ($expr + 3)
  }

  rule { ($expr:expr) } => {
    "expression: " + $expr
  }
}

foo { 1 + 2 }</div>

One of the most useful things about macros is overriding existing keywords to extend functionality. For example, you could implement a `var` macro which overrides the builtin `var` and add ES6 [destructuring](http://wiki.ecmascript.org/doku.php?id=harmony:destructuring). Of course, if destructuring is not used, you simply expand to the original `var` statement.

This poses a problem though: you need to emit code that does not recursively expand your macro. This is possible by defining your macro with the `let` form like this: `let foo = macro { ... }`. Now `foo` in your expanded code will reference whatever `foo` was outside of your macro, so it won't be expanded. If you were making a `var` macro, any `var` that you emit will be the builtin `var`. 

<a href="#recursive-macros" data-editor-change="7">Click here</a> to change the above example into a `let` macro.

### Repeated Patterns

Repeated patterns allow you to capture multiple instances of a pattern at a time. This comes up all time when matching syntax. You add an ellipses, `...`, to match repeats of a pattern.

A basic example: `rule { ($name ...) } => { $name ... }`. This matches all the syntax within the parentheses, and strips the parentheses in the output.

A repeated pattern matches 0 or more times, so you can't use it enforce the existance of a pattern. In this sense, it will *always* match, even if the match is nothing.

```js
macro basic {
  rule { { $x (,) ... } } => {
    wrapped($x (,) ...);
  }
}

basic {} // expands to wrapped()
basic { x, y, z } // expands to wrapped(x, y, z)
```

To make repeated patterns more useful, sweet.js lets you specify a separator which is a token that separates the patterns. For example, `rule { $name (,) ... } => { $name (,) ... }` says that a comma should exist between matches, and emits the comma with the repeated names. You can drop the comma when emitting code (just use `$name ...`) and it would only emit the list of names, stripping the comma off. It's very common to separate elements with a comma in JavaScript (think function args, array elements, etc).

Finally, to actually specify a complex pattern you need to use pattern groups. The ellipses only works on the single match variable preceding it, so you need to "group" a pattern into a single element. This is how you do that: `rule { $($name = $init) (,) ... } => { $name ... }`. Note the extra `$()` which creates a pattern group. That macro would match syntax like `x = 5, y = 6, z = 7` and emit `x y z`. You can use pattern groups and separators optionally when matching and when emitting code, allowing you to transform repeated patterns into any other repeated pattern that you want.

Hopefully this will make more sense by playing around with it some. Here are some macros for you to fiddle with:

<div class="macro-editor" id="repeated-patterns">macro basic {
  rule { { $x (,) ... } } => {
    wrapped($x (,) ...);
  }
}

basic {}
basic { x, y, z }</div>


* <a href="#repeated-patterns" data-editor-change="ex8a">basic</a> - a simple repeated pattern
* <a href="#repeated-patterns" data-editor-change="ex8b">function</a> - simple function tracing
* <a href="#repeated-patterns" data-editor-change="ex8c">var</a> - var with single-element destructuring
* <a href="#repeated-patterns" data-editor-change="ex8d">nested</a> - nested repetitions!

All of these examples are intentionally simplistic to make it easy to play with. The `var` macro, for example, breaks `var` because you can't use the builtin `var` like normal. In future tutorials we will dive into much more complicated macros that account for things like that.

Repeated patterns are useful, but if you want more control over the patterns that are matched it's common to use recursive macros instead. This lets you do things like force matching on 1 or more, capture multiple different patterns, and more. Again, more to come in the next tutorial!

### Hygiene

I can't *not* talk about hygiene here, although this usually doesn't affect how you write macros. In fact, that's the point of hygiene: it all works automatically so you don't have to worry about name collisions! 

All macros in sweet.js are fully hygienic, which means that identifiers always reference the correct thing. If a macro creates a new variable (like using `var`), it will only be available within the macro's body. It will not collide with another variable of the same name in the code that *uses* the macro. By default, you can't introduce new variables into an unintended scope. You can do this intentionally with a bit of work, and we'll cover that in future tutorials.

<div class="macro-editor" id="hygiene">macro foo {
  rule { $id = $init } => {
    var $id = $init
  }
  rule { $init } => { var x = $init }
}

foo 5;
var x = 6;

foo y = 10;
var y = 11;</div>

In the above example, The first 2 cases create 2 different variables because the macro itself created an `x` which is different than the `x` I made with `var`. In the last 2 cases, both reference the same `y` because I passed it in to the macro. 

Hygienic renaming is the reason you see a variable like `foo` renamed to 'foo$1234'. sweet.js ensures that each variable is referencing the correct thing. It must rename all variables for reasons explain in [this post](http://disnetdev.com/blog/2013/09/27/hygiene-in-sweet.js/). Unfortunately that means all your identifiers become a little ugly, but if you pass the `-r` or "readable names" options to the sweet.js compiler, it will clean that up and most of it will be pretty again. That only works on ES5 code right now, which is why it's not on by default.

## Using the sweet.js Compiler

That's it for the first tutorial. Now you just need to learn how to integrate sweet.js with your own projects.

You can install sweet.js with this simple npm command: `npm install -g sweet.js`. Now the compiler `sjs` should be available from the command line. Run it without any arguments to see the various options. These are a few important ones:

* **-o** The name of the output file. Without this it will print to stdout.
* **-c** Generate a source map beside the output file specificed with `-o`. Code that uses sweet.js macros are easily debuggable like normal!
* **-m** a comma-delimited list of modules to import. it basically resolve these names against node and just includes all macros from the file.
* **-r** Use readable names when renaming variables. This removes most of the `$1234` suffixes due to hygienic renaming, but for now it's only works on ES5 code.

So if you wanted to compile a file that uses macros named `foo.js` and generate sourcemaps, you would run `sjs -c -o foo.built.js foo.js`. You can use a different file extension like `.sjs` if you want.

I recommend the [source-map-support](https://github.com/evanw/node-source-map-support) node module when running in node which automatically translates error messages using sourcemaps. All you have to do is add `require('source-map-support').install()` at the top of the file.

### Grunt

Eventually you'll want to integrate this with a build process like [Grunt](http://gruntjs.com/). A [grunt-sweet.js](https://github.com/natefaubion/grunt-sweet.js) task is available which makes a lot of this easier, and even automatically adds `source-map-support` support to your files under node (if configured to do so).

Once you have grunt installed (see [Getting Started](http://gruntjs.com/getting-started)), you should configure it to compile all your files with sweet.js. Install the grunt plugin with `npm install grunt-sweet.js --save-dev`, and write a `Gruntfile.js` that mimicks [my example for a sweet.js projects](https://gist.github.com/jlongster/8838950).

That example Gruntfile.js assumes you have all your JavaScript in a directory named `src`. It will build everything in there into another directory `build`. If you call `grunt watch`, it will compile any file that changes in `src`. You should run your app from the `build` directory. The options for the sweetjs task are similar to the CLI tool; read the [README](https://github.com/jlongster/grunt-sweet.js/blob/master/README.md) for more information.

You can tweak that setup to your liking; that's how I prefer it. Client-side JavaScript is located in different locations but the build process is the same.

### Gulp/Makefile/etc

Integration with the [gulp](http://gulpjs.com/) build system exists too. You want the [gulp-sweetjs](https://github.com/sindresorhus/gulp-sweetjs) plugin. I haven't used gulp yet so I can't say much about it, but it should be pretty up-to-date. Also feel free to combine `sjs` with a `Makefile` for a quick solution, if that's your thing!

## End of Part I

That covers the basics of writing macros with sweet.js. There is still a lot to cover and I will dive much deeper in the next tutorial, which I will release in a week or two. [Follow my blog](http://feeds.feedburner.com/jlongster) to see when that comes out. I am also speaking at [MountainWestJS](http://mtnwestjs.org/2014/sessions) about macros March 17-18th so let me know if you'll be there!

(Thanks to Tim Disney, Nate Faubion, Dave Herman, and other who reviewed this)

<script src="http://jlongster.com/s/jlongster.com-util/jquery-2.1.0.min.js"></script>
<script src="http://jlongster.com/s/jlongster.com-util/underscore-min.js"></script>
<script type="text/javascript" src="/s/macro-editor/codemirror-3.20/lib/codemirror.js"></script>
<link rel="stylesheet" href="/s/macro-editor/codemirror-3.20/lib/codemirror.css">
<link rel="stylesheet" href="/s/macro-editor/codemirror-3.20/theme/ambiance.css">
<link rel="stylesheet" href="/s/macro-editor/style.css">
<script type="text/javascript" src="/s/macro-editor/codemirror-3.20/mode/javascript/javascript.js"></script>
<script type="text/javascript" src="/s/macro-editor/sweetjs/escodegen.js"></script>
<script type="text/javascript" src="/s/macro-editor/editor.js"></script>
