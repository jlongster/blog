---
published: true
shorturl: "Experimenting-with-Debugging-Languages-in-the-Browser"
tags: []
date: "March 20, 2012"
---

# Experimenting with Debugging Languages in the Browser

_tl;dr I'm experimenting with an in-browser stepping debugger for [my language](https://github.com/jlongster/outlet). It works, but code in debug mode runs too slow, so I'm trying optimize it. [View the prototype here](http://jlongster.com/s/outlet/debugger.html)._

If you haven't noticed, I've been working on my [own little Lisp](https://github.com/jlongster/outlet). While building something from the ground up gives you tremendous power, it comes at a cost. You have no community, and you have to build _everything_ from the ground up. 99% of the time you're better off building on an existing project. There are two reasons you should build something from scratch:

* **Learn** You want to really immerse yourself in a problem and learn all the details about how something works. The best way to do this is to actually build it from scratch. If you want to learn about http servers, build a HTTP/1.0 compatible server without any libraries.

* **Innovate** You really believe that you're onto something that can't be done on top of existing projects. Building it from scratch lets you explore all your ideas unhindered by pre-existing decisions in other projects.

The former reason is great and happens all the time. That's why there are so many todo list apps, blogging engines, http servers, and more. This type of hacking should be encouraged because the developer is getting a full understanding of what's going on.

The latter reason is more risky. If you actually want people to start using your software, you will pay an emotional toll if it fails. You are investing time and energy into something expecting (or hoping) to get a good return on investment. Popularity. Contributors. Whatever the goal is, you're starting a small not-for-profit project and wanting it to succeed. You most likely have grand visions for it.

[Outlet](https://github.com/jlongster/outlet) serves both purposes for me. I've learned a lot about compilers, interpreters, environments, stacks, and much more. It's very exciting to see programs actually _work_ in a language that _you_ wrote.

I also have exciting ideas for Outlet, ones that could make Outlet a viable langauge for people to use. There's actually one idea that has stuck with me since I started Outlet: debugging. Debugging in many other languages is crap. If I have to use `print` to debug my code, you're doing it wrong. I'm not saying `print` is bad for casual inspection, but on the whole it should not be needed for debugging.

I want a stepping debugger that allows me to modify any part of the program on the fly. This is my single most desired feature for Outlet. In my opinion, Outlet will fail if it can't provide this. It's important because Outlet compiles to Javascript, and I can't expect people to debug generated javascript. I can't guarantee it will look closely to Outlet code.

I've been working on this feature for the past few weeks. Here's how it's going:

* Implemented a macro-based debugger (same concept as this [tracer](https://gist.github.com/1840230)). Every single form expands with debugging code that, if in stepping mode, fires up a REPL and lets you step through code. This works by blocking the program with a call for input (like `read`).

* Realized that I can't do anything blocking in the browser. If the stepping debugger is going to work in-browser, I can't depend on the javascript stack at all. There's no way to pause/resume it (except with `alert`).

* Implemented a [meta-circular evaluator](https://gist.github.com/1979842) with environments, but discovered it still depends on the javascript stack, so in-browser stepping is still impossible.

* Needing to go one level deeper, I implemented a [register-based virtual machine](https://github.com/jlongster/outlet-machine) for a basic Lisp. This gives me control of the stack, but requires the Lisp code to be compiled to special assembly code which is interpreted.

The virtual machine is inspired from the last chapter of [SICP](http://mitpress.mit.edu/sicp/full-text/book/book.html), a book I highly recommend to any programmer. Since it simply takes instructions and executes them sequentially, I can easily pause the execution and resume it later on.

This is powerful, because I can stop the code, get some input from the user, and resume. A stepping debugger. I can inspect the environment, modify variables, and do all sorts of things. I put up a demo of it here:

[View the prototype Outlet debugger](http://jlongster.com/s/outlet/debugger.html)

Another technique would be [SourceMaps](https://wiki.mozilla.org/DevTools/Features/SourceMap), which will be supported in Firefox and Chrome soon. These are files which tell the native debugger in the browser how to map javascript code to source code. In my opinion, this is the right way to implement general debugging for languages.

However, if you consider something like a game development environment where you write lots of small scripts inside the browser, it would be **fantasic** to have a tightly integrated debugger. The user experience would be so much better if they could use the same window to debug scripts as they do to write them. They could easily evaluate new code while they are debugging, and do other such things.

Also, the native debuggers in browsers don't help if you're writing server-side scripts.

I've hit a snag though: for code to be debugged, it must be running in interpreted mode. Since you want to be able to turn on a breakpoint at any time, you always need to run the code in intrepreted mode when developing. If I want to develop games with Outlet, I need it to run fast enough to render ~30 frames a second. I'm not sure if this is possible.

This is where SourceMaps are great: all you have to do is provide a SourceMap file, and you can happily debug your code whenever you want, and it's always running at native javascript speeds.

I have a few ideas for optimizing the [assembly interpreter](https://github.com/jlongster/outlet-machine/blob/master/machine.ol), but I'm not sure how good I can get it. This is what research is for, though! Even if this fails, I've learned a lot through this. And if it doesn't, I'll have an awesome project on my hands.

If you have any ideas on how I should optimize this, or where I should go from here, let me know!

*Discuss this on [Hacker News](http://news.ycombinator.com/item?id=3737090)*