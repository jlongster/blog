---
tags: ["asm.js","js","noteworthy"]
published: true
date: "March 25, 2013"
readnext: ""
abstract: "Mozilla recently announced asm.js, a specification of a restricted subset of javascript that can be ridiculously optimized. It's difficult to write by hand, so I ported a language called LLJS to compile to it, unlocking high performance in browsers with a C-like language."
shorturl: "Compiling-LLJS-to-asm.js,-Now-Available-"
headerimg: "http://jlongster.com/s/post-headerimgs/postbg-asm.png"
---

# Compiling LLJS to asm.js

I'd like to announce that I have [LLJS](http://lljs.org/) successfully compiling to [asm.js](http://asmjs.org/), so we can tap into the amazing optimizations provided from it. This is just a start, and there are many things missing, but I'd like to show that it works. You can get it from the [asm.js branch of my fork](https://github.com/jlongster/LLJS).

[asm.js](http://asmjs.org/) is a highly optimizable subset of javascript being worked on by Mozilla. It's a specification that allows you to opt-in to high performance code by writing extremely restricted type-annotated javascript code (or more likely, compiling to it). If the engine has implemented asm.js, the code runs incredibly fast (at most about a 2x performance hit compared to native), otherwise it will still run, of course, because asm.js is just a subset of javascript.

Last Thursday Luke Wagner announced that [support for asm.js has been merged into Firefox Nightly](https://blog.mozilla.org/luke/2013/03/21/asm-js-in-firefox-nightly/). You can read more about this in the [FAQ](http://asmjs.org/faq.html), [Axel Rauschmayer's post](http://www.2ality.com/2013/02/asm-js.html), and [Alon Zakai's talk](http://www.ustream.tv/recorded/29324270) at mloc.js.

What's really interesting is that a few months back a few guys at Mozilla released [LLJS](http://lljs.org/), a low-level javascript language. You can mix statically-typed code with normal javascript and it compiles the statically-typed portions into optimized stack and heap accesses using typed arrays.

The minute I heard of asm.js I *knew* I wanted LLJS to compile to it so that we can write C-like code that compiles to highly performant asm.js code (and again, runs normal on browsers that haven't implemented asm.js). This is essentially the same thing as writing C code and compiling it with [emscripten](https://github.com/kripken/emscripten) to asm.js code, but it opens up new options that aren't available with emscripten (think of writing LLJS in the browser, and a much simpler compilation process).

Here's what LLJS looks like:


```js
extern assertEqual, sqrt;

// struct types
struct Point {
  function void Point(double x, double y) {
      this->x = x;
      this->y = y;
  }

  double x, y;
}

function double length(Point *p) {
  // builtin Math.* functions
  return double(sqrt(p->x * p->x + p->y * p->y));
}

function double main() {
  // stack-allocated structs
  let Point p(1.2, 3.4);
  
  assertEqual(p.x, 1.2);
  assertEqual(p.y, 3.4);

  // functions & pointers
  let double l = length(&p);
  assertEqual(l, 3.605551275463989);

  // casting to int truncates
  assertEqual(int(l), 3);
}
```

This now compiles to asm.js, and you can see the output in [this gist](https://gist.github.com/jlongster/5222676). A benchmark is provided at the end of this post. In order to compile to asm.js, I had to remove the ability to mix normal untyped javascript code, so it all has to be typed.

Things that work:

* Primitive types (u8, i8, u16, i16, etc)
* Int and double arithmetic, with ints automatically coerced to doubles if mixed
* `while` and `for` loops
* Functions
* Pointers (dereferencing and referencing with `&` and `*`)
* Structs with constructors
* Unions

You can see all the tests that are currently passing in the [`test/asm`](https://github.com/jlongster/LLJS/tree/asm.js/test/asm) folder (the .ljs files), including [primitives](https://github.com/jlongster/LLJS/blob/asm.js/test/asm/primitives.ljs), [custom types](https://github.com/jlongster/LLJS/blob/asm.js/test/asm/types.ljs), and more.

Please note that **this is highly experimental**. It will likely change a whole bunch in the next few months, and I suggest you only use it to tinker with asm.js for now. This is mainly a proof of concept, and allows developers easy access to asm.js early on.

## Why Use This?

First of all, most web apps don't need this. In my opinion, asm.js allows new kinds of apps to run on the web, like crazy 3d games and possibly even whole VMs for other languages. That's the kind of stuff this is for. Please *do not* write an MVC framework in LLJS!

You can still do [amazing things](http://codepen.io/anandylaanbaatar/pen/tqdmv) without asm.js.

## What's Missing?

This is very much an early version, and there are important features missing and other things I'd like to see in the future:

* No `malloc`, `free`, or `new`, so no dynamic allocation (I just need to port the old allocator or find a new one)
* There are bugs in various language-level features
  * `for` loops require the initializer variable to be declared outside the loop
  * Static array initializers are broken (`let int x[2] = [1, 2]`)
  * I'm sure there are others
* No way interface with normal javascript code
  * `extern` still works so the code can call out to external functions, but the compiler doesn't allow you to add javascript variables to import into the asm.js code
* No way to compile multiple files or import files (you can only compile a single LLJS file)
  * I'm especially interested in a way to link with emscripten-generated code, so could compile something like a 3d engine with emscripten and use LLJS to call it.

Obviously, some of these are show stoppers but the goal of this version was to build the initial asm.js support, and now that it's working I'm going to fix the above issues. Expect a lot of progress in the next few weeks.
 
## Small Benchmark

I ported a benchmark called "memops" I found in emscripten to LLJS to get some early results. Benchmarking is hard, but this looks like a decent one to give an idea.

```js
extern start, end, print;

function void run() {
  let int N = 16384;
  let int M = 200;
  let int final = 0;
  let u8 buf[16384];
  let int t, i;

  for(t = 0; t < M; t = t + 1) {
    for(i = 0; i < N; i = i + 1) {
      buf[i] = (i + final) % 256;
    }

    for(i = 0; i < N; i = i + 1) {
       final = final + buf[i] & 1;
    }

    final = final % 1000;
  }
}

function void main() {
  let int i;
  start();  

  for(i = 0; i < 1000; i++) {
    run();
  }

  print(int(end()));
}
```

Results (in ms):

<pre><code>V8:                   9919
SpiderMonkey:         13709
SpiderMonkey+asm.js:  <span class="asm-asm-num">6391</span>
Native:               <span class="asm-native-num">4002</span>
</code></pre>

I'm running this on OS X 10.8 with the latest versions of all the engines. I ported the code to native so I could include that number too.

This is actually the second benchmark I wrote. It's interesting that the [first benchmark](https://github.com/jlongster/LLJS/blob/asm.js/test/asm/bench.ljs) actually wasn't *that* much faster with asm.js, proving that you really shouldn't prematurely optimize.

## Much More to Come!

If you like this project, follow my [LLJS fork](https://github.com/jlongster/LLJS) on github. I'm going to talk to the original creators and see what they think of this. I'll also be posting a lot more about this, so you can [subscribe](http://feeds.feedburner.com/jlongster) to my blog or [follow](http://twitter.com/jlongster) me on twitter!





