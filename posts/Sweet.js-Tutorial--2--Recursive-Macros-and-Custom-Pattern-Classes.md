---
tags: ["js","macros"]
published: true
date: "March 12, 2014"
readnext: "Writing-Your-First-Sweet.js-Macro"
abstract: "This tutorial explores how to write more complex sweet.js macros. There are several use cases which require more control over pattern matching, and recursive macros and pattern classes allow this and let you build abstractions when writing macros."
shorturl: "Sweet.js-Tutorial--2--Recursive-Macros-and-Custom-Pattern-Classes"
headerimg: ""
---

# Sweet.js Tutorial #2: Recursive Macros and Custom Pattern Classes

In the [first tutorial](http://jlongster.com/Writing-Your-First-Sweet.js-Macro), we covered the basic concepts of sweet.js macros. Now we will look at a few techniques which help build more complex macros: recursion and custom pattern classes.

*All of these tutorials are available in the [sweet.js-tutorials](https://github.com/jlongster/sweet.js-tutorials) repo along with a working environment to build sweet.js macros.*

For this tutorial, let's build a macro that implements ES6 [variable destructuring](http://wiki.ecmascript.org/doku.php?id=harmony:destructuring). You might start with something like this:

<div class="macro-editor" id="var1">let var = macro {
  rule { [$var (,) ...] = $obj:expr } => {
    var i = 0;
    var arr = $obj;
    $(var $var = arr[i++]) (;) ...
  }

  rule { $id } => {
    var $id
  }
}

var [foo, bar, baz] = arr;</div>

This is a very basic attempt that only handles simple array
destructuring. We assign the target object to `arr` to make sure that expressions are only evaluated once. ES6 destructuring handles a lot more complex stuff: 

* Object/hash destructuring: `var {foo, bar} = obj;`
* Defaults: `var [foo, bar=5] = arr;`
* Renaming: `var {foo: myFoo} = obj;`
* Nested destructuring: `var {foo, bar: [x, y]} = obj;`

You can write the above macro with all of the concepts learned in the first tutorial, but if you tried to support the above versatile syntax you probably got stuck. Now we will look at a few techniques for handling more complex use cases.

## Recursive Macros

I mentioned recursive macros in the first tutorial briefly, but they are worth looking at more closely for how you can use them to solve common problems.

The output of a macro is always expanded again by sweet.js, so writing recursive macros is as natural as writing recursive functions. You simply have a rule that invokes your macro again, and another rule that matches the stopping case and stops expansion.

A common use case for recursive macros is processing a list that has non-uniform syntax. Usually you match a list of syntax with the repeating form `$item (,) ...`, and you can even match complex syntax with groups: `$($item = $arr[$i]) ...`. The problem is that each item in the list *must* have the same structure. You can't match various types of syntax within the list. sweet.js doesn't have the OR `|` operator or the optional operator `?` like regexes do.

For example, say you wanted to match a list of names that might have an initializer value: `x, y, z=5, w=6`. We want to iterate through the items and generate different code if the initializer value exists. Here's how you could do that recursively:

<div class="macro-editor" id="var1b">macro define {
  rule { , $item = $init:expr $rest ... ; } => {
    var $item = $init;
    define $rest ... ;
  }
  
  rule { , $item $rest ... ; } => {
    var $item;
    define $rest ... ;
  }

  rule { ; } => { ; }

  rule { $items ... ; } => {
    define , $items ... ;
  }
}

define x, y, z=5, w=6;</div>

When using recursive macros, you typically need to handle edge cases like trailing commas. Since we are matching on a comma-delimited list of items, we need to strip the comma off, but we can't assume there's always a comma because the last item doesn't have one after it. We solve this by adding a comma at the beginning of the list, and then stripping that comma off when iterating through the list. Since the initial invoke never has a comma in front, it will fall through to the last rule which adds the comma and recursively invokes.

When there are no more items left, only `;` exists so it matches the third rule which simply outpus `;` and stops iterating.

Now is a good time to remind you that you can step through macro expansion by pressing "step" in the editor. Stepping is invaluable when debugging recursive macros. You can watch how it expands the form piece by piece.

So you can see how expanding this way gives you a lot of control over expansion. Now let's look at a more complex example. Let's try to add a feature to our original destructuring macro: the ability the specify default values. So you can use an array form with a comma-delimited list of variable names, and optionally an `=` specifying a default value if the element does not exist. `var [foo, bar=5] = ...` and `var [foo, bar=5, baz] = ...` are all valid.

First, note how we used a `let` macro in our first example: `let var = macro { ... }`. Remember what that does? It tells sweet.js that any `var` we generate should not be recursively expanded.

We need to create a helper macro which will be recursive, since we can't make `var` recursive. Here's how you could implement destructuring with the optional initializer form:

<div class="macro-editor" id="var2">macro destruct_array {
  rule { $obj $i [] } => {}

  rule { $obj $i [ $var:ident = $init:expr, $pattern ... ] } => {
    var $var = $obj[$i++] || $init;
    destruct_array $obj $i [ $pattern ... ]
  }

  rule { $obj $i [ $var:ident, $pattern ... ] } => {
    var $var = $obj[$i++];
    destruct_array $obj $i [ $pattern ... ]
  }
}

let var = macro {
  rule { [ $pattern ...] = $obj:expr } => {
    var arr = $obj;
    var i = 0;
    destruct_array arr i [ $pattern ... , ]
  }

  rule { $id } => {
    var $id
  }
}

var [x, y] = arr;
var [x, y, z=10] = arr;</div>

The `var` macro returns syntax that contains the `destruct_array` macro, and sweet.js recursively expands it. This is a little complicated, but it's not too bad. Let's walk through it:

* `destruct_array` is the recursive macro that expands only one item of the array at a time. It does this by matching on the first item, generating code for it, and emitting another invocation of `destruct_array` with the rest of the items. When there are no more items to expand, it simply stops.
* In the `var` macro, we added an extra comma at the end of the array that is the third the argument to `destruct_array`. This makes it easy to `destruct_array` to pick off the first item because it can always assume there is a trailing comma.
* `$pattern ...` matches 0 or more elements, so `[ $var, $pattern ]` will match the last item like `[ x , ]`, strip it off, and then `[]` will match the rule which stops recursion.
* We don't need to use the pattern `$pattern (,) ...` even though we are matching comma-delimited items. All we are doing it passing along whatever `$pattern ...` is and not processing the items, so it can match everything including the commas.

Here's how `var [x, y=5] = expr` is expanded:

```js
var [x, y=5] = expr;

var arr = expr;
var i = 0;
destruct_array arr i [ x , y = 5 , ];

var arr = expr;
var i = 0;
var x = arr [ i ++ ];
destruct_array arr i [ y = 5 , ];

var arr = expr;
var i = 0;
var x = arr [ i ++ ];
var y = arr [ i ++ ] || 5;
destruct_array arr i [ ];

var arr = expr;
var i = 0;
var x = arr [ i ++ ];
var y = arr [ i ++ ] || 5;
```

It's also worth noting that there are a few places in JavaScript where you can't invoke macros. If you are using helper/recursive macros you need to watch out for this. For example, you can't run macros in the place of `var` bindings or function argument names. `var invoke_macro { do_something_weird }` does not work, and `function foo(invoke_macro {}) {}` doesn't either.

That means that you can't do a macro like this:

<div class="macro-editor" id="var3">macro randomized {
  rule { RANDOM $var } => {
    $var = Math.random()
  }
  
  rule { $var (,) ...; } => {
    var $(randomized RANDOM $var) (,) ...
  }
}

randomized x, y, z;</div>

However, if you <a href="#var3" data-editor-change="rec1">remove the <code>var</code></a> it works. What you really want here is the ability to **locally expand** syntax inside the rule, but sweet.js does not support this yet.

Ideally our macro should expand to a single `var` statement like `var arr = expr, i = 0, x = arr[i++]` instead of multiple `var` statements. Our current macro won't work in `for` and `while` statements (`for(var [x, y] = arr; x<10; x++) {}`) because multiple statements are invalid there. Unfortunately, we would need to recursively invoke a macro in the `var` binding place but we can't do that as explained above. The macro would look like `var destruct_array arr i [ $pattern ... , END ]`, but you can't do that.

Let's continue working on the destructuring macro and add support for nested destructuring. You should be able to do `var [x, [y, z]] = arr` but our macro doesn't handle that. Because we of recursive macros, it turns out to be really easy to add that. All we need to do is relax the accepted token type in `destruct_array` to accept anything (`$var:id` was changed to `$first`) and switch the order of macros.

<div class="macro-editor" id="var4">let var = macro {
  rule { [ $pattern ...] = $obj:expr } => {
    var arr = $obj;
    var i = 0;
    destruct_array arr i [ $pattern ... , END ]
  }

  rule { $id } => {
    var $id
  }
}

macro destruct_array {
  rule { $obj $i [ END ] } => {
  }
  
  rule { $obj $i [ $var:ident = $init:expr, $pattern ... ] } => {
    var $var = $obj[$i++] || $init;
    destruct_array $obj $i [ $pattern ... ]
  }

  rule { $obj $i [ $first, $pattern ... ] } => {
    var $first = $obj[$i++];
    destruct_array $obj $i [ $pattern ... ]
  }
}

var [x, y] = arr;
var [x, [y=5, z]] = arr;</div>

We switched the order of `var` and `destruct_array` because we use `var` in `destruct_array` to create the new identifiers and initialize them to the right element. If the "element" is actually *another* pattern like `[y, z]` we want to destructure that. Can't we simply use our `var` macro to recursively destructure it? Yes, we can! Right now, `let` macros are only available after they are defined, so if we define `destruct_array` afterwards it will recursively expand into it.

Recursive macros give you more control over expansion. I'll leave it up to the reader to add object destructuring (`var {x, y: foo} = obj`). While recursiveness is useful, let's look at another way to match complex patterns that can be more intuitive and easier to use.

## Custom Pattern Classes

In the first tutorial I mentioned pattern classes which tell the expander what kinds of tokens to match. `ident`, `lit`, and `expr` are builtin to sweet.js. You can actually define your own pattern classes as well to abstract away complex pattern matching.

The common issue here is the need for building abstractions, which is especially necessary when you want to match things like repeated patterns. Recursive macros allow you to build helper macros that make those layers of abstraction. Custom pattern classes allow you to as well, but they are more intuitive.

It's very simple to make your own pattern class: just make a macro! A macro can be invoked as a pattern class simply by using it as one (given a macro `foo`, use `rule { $x:foo } => {}`). There are also two forms you can use: `$x:invoke(foo)` and `$x:invokeOnce(foo)`. `invoke` will recursively expand the result of the `foo` macro, and `invokeOnce` will just expand it once. `$x:foo` is just a shorthand for `$x:invoke(foo)`.

Here is the recursive `define` macro that we made before, but using pattern classes instead:

<div class="macro-editor" id="pat1">macro item {
  rule { $item = $init:expr } => {
    var $item = $init
  }

  rule { $item } => {
    var $item
  }
}

macro define {
  rule { $items:item (,) ... ; } => {
    $items (;) ...
  }
}

define x, y, z=5, w=6;</div>

A pattern class runs the macro on the current stream of tokens, and is replaced by whatever the macro is expanded to.  The `item` macro returns the `var` definitions, and all we have to do in `define` is output `$items`. Pattern classes are easier for many use cases than recursive patterns because you don't have to do the bookkeeping of trailing commas and such.

If `item` returned code that had a macro as the first token, it would be continually expanded. Any macros anywhere else in the code are not expanded; recursiveness with `$items:invoke(item)` or `$items:item` only applies to a macro returned in the "head" position. If you don't want that to happen, use `$items:invokeOnce(item)` to get back just the initial match.

What would our destructure macro look like with pattern classes instead of recursive macros? You think we might be able to do something like this:

```js
let var = macro {
  rule { [ $pattern:destruct_array (,) ...] = $obj:expr } => {
    $pattern (,) ...
  }

  rule { $id } => {
    var $id
  }
}
```

The problem is that we need to pass parameters to `destruct_array`. We can do this by transforming the list of elements to include them for every element, and then use a helper macro to fire off the pattern class:

```js
let var = macro {
  rule { [ $pattern:expr (,) ...] = $obj:expr } => {
    var arr = $obj;
    var i = 0;
    destruct [ $(arr i $pattern) (,) ... ]
  }

  rule { $id } => {
    var $id
  }
}

macro destruct {
  rule { [ $pattern:destruct_array (,) ... ] } => {
    $pattern (;) ...
  }
}
```

We create the `arr` and `i` variables that we need to track destructuring state, and create a list of items that `destruct` can pick apart with `destruct_array`. Now we just need to define `destruct_array`. Here's the full macro:

<div class="macro-editor" id="pat2">let var = macro {
  rule { [ $pattern:expr (,) ...] = $obj:expr } => {
    var arr = $obj;
    var i = 0;
    destruct [ $(arr i $pattern) (,) ... ]
  }

  rule { $id = $init:expr } => {
    var $id = $init
  }
  
  rule { $id } => {
    var $id
  }
}

macro destruct_array {
  rule { $obj $i $var = $init:expr } => {
    var $var = $obj[$i++] || $init
  }

  rule { $obj $i $var } => {
    var $var = $obj[$i++]
  }
}

macro destruct {
  rule { [ $pattern:destruct_array (,) ... ] } => {
    $pattern (;) ...
  }
}

var [x, y] = arr;
var [x, y, z=10] = arr;
var [x, [y, z=10]] = arr;</div>

This supports both the initializer form (`var [x=5] = arr`) and nested destructuring. It's really interesting how nested destructuring works here: the `var` generated by `destruct_array` is referencing our macro so it is recursively expanded. Recursiveness still works with pattern classes, but you have to be careful. Whatever is returned by our `var` macro is what is injected into the match in `destruct`. Notice how we added another rule in `var` to match the normal `$id = $init:expr` form. We needed that so that it returned the full expression to `destruct` when recursively expanding.

Currently you can't step through pattern class expansion, but here's what it looks like:

```js
var [x, y=5] = expr;

var arr = expr;
var i = 0;
destruct [ arr i x , arr i y = 5 ]

// pattern class running: `destruct_array arr i x`
arr i x

var x = arr[i++]

// expanded with `var` macro
var x = arr[i++]

// pattern class running: `destruct_array arr i y = 5`
arr i y = 5

var y = arr[i++] || 5

// expanded with `var` macro
var y = arr[i++] || 5

// back inside `destruct`

var x = arr[i++];
var y = arr[i++] || 5;
```

This macro can now do everything our recursive macro can do, and it's cleaner. It also gets us closer to the possibility of generating a single `var` statement like `var arr = expr, i = 0, x = arr[i++]` because pattern classes let us use repeaters. The form `var $el (,) ...` is valid because it's expanded before handed back to the parser; you just can't recursively expand in the place of a `var` binding.

Unfortunately, since we need to create two new bindings `arr` and `i` we can't generate a single var statement. The `var` macros makes those bindings and then invokes the `destruct` macro, so that macro invocation can't be in a `var` binding place. The only thing that will really allow us to generate a single `var` statement is the ability to manually locally expand syntax inside a macro rule, but we don't support that yet.

## End of Part II

You can create a lot of interesting macros using both of these techniques. In the future we will cover things like infix macros, case macros, and much more. Stay tuned and [follow my blog](http://feeds.feedburner.com/jlongster) for future tutorials!

<script src="http://jlongster.com/s/jlongster.com-util/jquery-2.1.0.min.js"></script>
<script src="http://jlongster.com/s/jlongster.com-util/underscore-min.js"></script>
<script type="text/javascript" src="/s/macro-editor/codemirror-3.20/lib/codemirror.js"></script>
<link rel="stylesheet" href="/s/macro-editor/codemirror-3.20/lib/codemirror.css">
<link rel="stylesheet" href="/s/macro-editor/codemirror-3.20/theme/ambiance.css">
<link rel="stylesheet" href="/s/macro-editor/style.css">
<script type="text/javascript" src="/s/macro-editor/codemirror-3.20/mode/javascript/javascript.js"></script>
<script type="text/javascript" src="/s/macro-editor/sweetjs/escodegen.js"></script>
<script type="text/javascript" src="/s/macro-editor/editor.js"></script>
