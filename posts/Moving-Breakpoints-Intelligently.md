---
abstract: "In most debuggers, a breakpoint will \"slide\" if the clicked line doesn't have any code. This is supposed to be a helpful feature, but it becomes **infuriating** if it behaves wrongly. In Firefox 46, we made our breakpoint sliding algorithm much more robust."
shorturl: "Moving-Breakpoints-Intelligently"
tags: ["devtools"]
published: true
date: "February 26, 2016"
---

# Moving Breakpoints Intelligently

It all started with a tweet.

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">Please someone tell me they know how to fix this issue with breakpoints in <a href="https://twitter.com/FirefoxDevTools">@FirefoxDevTools</a> <a href="https://t.co/4OxaLXzI08">pic.twitter.com/4OxaLXzI08</a></p>&mdash; gregwhitworth (@gregwhitworth) <a href="https://twitter.com/gregwhitworth/status/672483012081127424">December 3, 2015</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

In most debuggers, a breakpoint will "slide" if the clicked line doesn't have any code. This is supposed to be a helpful feature, but it becomes **infuriating** if it behaves wrongly, as seen in the image.

There is no excuse for that happening. When we saw that tweet, we tried to explain it but we also knew that we *had* to fix it. We've known about this problem and mitigated it with various solutions, but this time I was determined to make it go away completely.

Our initial reaction was just to completely remove breakpoint sliding. It was far too infuriating to justify the feature and maintenance cost. But I felt like this would be too much of a regression; even if it's not that big of a feature, it's something nice that should be done if we know it's safe to do.

Luckily, I figured out a way to safely implement breakpoint sliding so that it *only* happens when you'd expect it to. This new algorithm will be available in Firefox 46. This post recounts my research from [bug 1230345](https://bugzilla.mozilla.org/show_bug.cgi?id=1230345) and explains what's so hard about it. (Read the bug title for how frustrated we were getting.)

## How Breakpoints Work

Breakpoints are way more complicated than you think. This is rooted in the fact that, well, executing programs is complicated.

Imagine that you wrote the following code:

```js
1 for(var i=0; i<10; i++) {
2   // Log the value
3   console.log(i); 
4 }  
```

Now you want to set a breakpoint on line 1. Where does the JavaScript engine set the breakpoint? There are multiple "entry points" on that line: the initial entry, the `i<10` check, and the `i++` expression. The line can be "re-entered" at various times in your program.

First you must realize that at the lowest of levels, the JavaScript engine is executing this as bytecode (ignoring optimized JIT-ed modes). Bytecodes are mapped to a line and column in the original source (although sometimes it's not even clear where it maps back to). We can tell the engine to notify us whenever any bytecode is run by setting "breakpoints" on bytecode (our handler will do the engine pausing). So we need to insert multiple breakpoints in all the places that a line can be "entered".

The SpiderMonkey debugger API has a nice function called `getLineOffsets` that returns all the bytecode instruction offsets that represent entry points for a specific line. Using this, we can map over all these offsets and call `setBreakpoint` with each offset and we will be notified whenever that line is hit, no matter which part of it.

That's all well and good. What if I set a breakpoint on line 2 instead? It's just a comment and there is no actual code on that line, so we won't get any bytecode offsets. This is when we want to try to slide the breakpoint to "help" the user (and potentially infuriating them).

Here's a simple algorithm for doing that. Assume `L` is the line we are trying to set a breakpoint on:

1. If `L` is greater than the number of lines in the script, stop
2. Try to set a breakpoint in line `L`
3. If bytecode offsets exist, set breakpoints on all of them and stop
4. Otherwise, `L = L+1` go to 1

We simply walk forward through the script until we find a line with bytecodes to actually set breakpoints on.

## Script Lifetimes

Take a moment and think: are there any problems with the above algorithm? I will be very impressed if you guessed it right, because it's quite subtle.

There's a very important thing at play here: script lifetimes. To explain this, we need to explain the difference between a SpiderMonkey "script" and "source". A "source" represents an entire JavaScript unit (a file, eval-ed code, etc), while all functions within it are represented as "scripts".

```js
1 var x = 1;
2
3 setTimeout(function() {
4  console.log("hi");
5 }, 1000);
6
7 function foo() {
8  return 5;
9 }
```

The above code is 1 source, but has 2 scripts: `foo` and the anonymous callback. There is actually a 3rd script that represents the top-level code (which is everything in the file), but don't worry about that. A script is not a function instance, it literally represents the set of bytecodes to run the code. Multiple function instances may exist from a single script.

Now here's the important part: *scripts can be garbage collected*. The anonymous function above? It's gonna be gone after a few GCs because once it executes, nothing holds a reference to it.

And guess what! Once a script is GCed, *it's as if it never existed*. If we try to set a breakpoint on line 4, we won't get any bytecode offsets! And since our sliding algorithm is so naïve, it'll walk forward through the script until it finds some. Guess where that is? Line 8, **in a completely different function!**

We've always known this, but we've tried various heuristics that failed under certain circumstances. We need a way to make sure that we *only* slide if there is not *and never will be* a function on a line. (It's useful to set a "pending" breakpoint on a line with no code because when you refresh it will hit the breakpoint. I won't go into pending breakpoints here.)

It gets more complex when you consider nested scripts. Scripts can be arbitrarily nested and we don't want to slide across nested scripts either.

It turns out there's a simple property of our script objects that we can use to determine when to do breakpoint sliding. Let's take a look at code with nested scripts:

```js
1 function foo() {
2   setTimeout(function() {
3     // Say hi!
4     console.log("hi");
5   }, 1000);
6  
7   return 5;
8 }
9
10 (function() {
11   var x = 10;
12  
13   window.bar = function () {
14     // Do somethin'
15     return x;
16   }
17 })()
```

There are several potential pitfalls here: we don't want to slide from line 3 to 7 (because the function passed to `setTimeout` is GCed), and the same for 11 to 15 (because the self-executing function was GCed, but `bar` is not because it's attached to `window`).

These scripts are nested, and SpiderMonkey's script objects have properties which represent this nesting. For example, `script.parent` will return the parent script. Fortuntely for us, this has a very important property: *parent scripts always keep their child scripts alive*. (Conversely, child scripts do *not* keep their parents alive.)

If a parent script has not been GCed, we know that *all* of its child scripts are alive as well. Let's take a look at what the above code looks like after everything has been GCed:

<pre id="lifetime-highlight"><code><div class="alive">function foo() {
  setTimeout(function() {
    // Say hi!
    console.log("hi");
  }, 1000);

  return 5;
}</div>

(function() {
  var x = 10;

<div class="alive">  window.bar = function () {
    // Do somethin'
    return x;
  }</div>
})()
</code></pre>

The red blocks represent live code, and everything else has been GCed. All the lines in the red blocks have scripts associated with them; even if we can't find code on a specific line, we can check if there are live scripts for that line. Note that the anonymous function passed to `setTimeout` is still alive! Although it looks like nothing holds a reference to it, the parent function is keeping it alive.

This means that we can modify our breakpoint sliding algorithm with a simple step: only slide if at least 1 script exists on the line, and only consider the lines that the script covers. We will only slide within the red blocks above, and nowhere else. That means we will never slide in the global scope [[1]](#footnote1), no matter if it truly is global scope or if it's a function that previously existed but has been GCed.

Note in the original gif that the code is executing in the global scope.

## Sourcemaps and Columns

That's not the only case to consider. A considerably more complex case is sourcemapping.

Sourcemapping breakpoints is very complicated. Remember how we needed to set breakpoints on all entry points for a single line? With sourcemaps, a single line can map to *several* lines in the generated code, so now we also need to set breakpoints across all those lines.

For example, let's take some basic JavaScript code:

```js
for(var i=0; i<10; i++) {
  console.log("hi!");
}
```

And assume that, for some reason, you really wanted to write a babel plugin to break this up. I don't know, maybe you really like code on multiple lines:

```js
1 var _initial_i = 0;
2 for(var i = _initial_i;
3         i<10;
4         i++) {
5   console.log("hi!");
6 }
```

If you are debugging the original code, if you set a breakpoint on the `for` loop we need to set breakpoints on *all* lines 1-4, because a single line actually runs across all of those.

Because of this, it becomes more ambiguous when and where to slide breakpoints. We decided that the additional complexity for sliding with sourcemaps is not worth the potential infuriation, so we completely removed sliding breakpoints when sourcemapping. We feel this is the right decision because we made multiple attempts at it and it never worked great enough.

Column breakpoints are yet another use case, and previously we attempted to even slide column breakpoints, but due to various ambiguities we removed column breakpoint sliding as well.

Setting breakpoints in the Firefox debugger should be a lot more stable these days, particularly because of these changes which will be available in Firefox 46. Hopefully it does what you expect it to, and if not, please [file a bug](https://bugzilla.mozilla.org/enter_bug.cgi?product=Firefox&component=Developer%20Tools%3A%20Debugger)!

Thank you Greg for complaining! Even if it's critical, *we need to know what pains you*. You *can* get things fixed by complainging about it! As long you keep it respectful, you should be vocal about how projects can improve.

<div class="footnote" id="footnote1">[1] This isn't entirely true; there is a script that represents top-level code which gets GCed after a source runs, so we will slide at the top-level if that script has not been GCed yet, but it's still safe because of the parent-keeping-child-scripts alive property. Unfortunately, that means that sometimes it will slide and sometimes it won't, but that's the nature of working with a GC.</div>

<style type="text/css">article iframe { margin: 0 auto } #lifetime-highlight { line-height: 1em; padding: .5em; background-color: #1d1f21  } #lifetime-highlight .alive { background-color: #a22923; } .footnote { font-size: .75em }</style>


