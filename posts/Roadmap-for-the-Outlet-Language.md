---
published: true
shorturl: "Roadmap-for-the-Outlet-Language"
tags: ["outlet"]
date: "January 10, 2012"
---

# Roadmap for the Outlet Language


I've been thinking a lot about [Outlet](http://jlongster.com/2012/01/04/outlet-my-lisp-to-javascript-experiment.html) recently. Outlet is a language that I just started working on. In short, the compiler is purely a source-to-source transformer and it compiles to pure javascript or lua.

Since it compiles straight to javascript or Lua, and the syntax is simple (see [Why the S-expression syntax?](#sexp)), I'm free to explore a lot of other interesting areas. Here are the milestones I hope to achieve:

* Rewrite the Outlet compiler in Outlet, which is currently in javascript. This is in progress and doing well since Outlet compiles to fully functioning javascript already.
* Implement macros by simply eval'ing the macro code at compile time. When the compiler is written in Outlet, this will work in both js and lua since the native language will be hosting the compiler.
* Define the desired Outlet semantics in more details and flesh out the language with more constructs, which will heavily use macros
* Write a dead-simple interpreter in Outlet to execute Outlet code. This will **purely** be for debugging purposes.
* Implement a debugger in the interpreter that supports stepping through code and inspecting all sorts of stuff in a web interface

I will finish #1-3 pretty soon I think. At that point, I'll probably build a game with it. My goal for Outlet is to be a language to write games in. All the decisions, libraries, and code will be based around that. It will provide a great environment for games, and you can compile it out to a lot of platforms.

I won't have a debugger yet, but since it compiles to very similar javascript code, I should be able to debug it normally. So I hope to build a game after #3.

The interpreter will be a fun project, but will probably take the most time. It should help a lot though to build it only for the purpose of debugging, so I shouldn't need to worry about hardcore optimizations.

<a id="sexp"></a>
## Why the S-expression syntax?

A lot of people aren't used to the syntax of Lisp, which is made up of parenthesized prefix expressions. An example is `(foo x y z)` which calls the function `foo` with the arguments `x`, `y`, and `z`. What's most confusing are operators because the difference is obvious: `(+ 3 2)` adds 3 and 2. And then they look at [larger examples](https://gist.github.com/1576001) of Lisp syntax and are completely turned off. Why would I want to manage all those parentheses?

This syntax is called "S-expressions" and before you discount it, remember that Lisp has been around for 40 years and loved by many. The community is small but passionate. And there's a reason, so let me try to explain why it works.

* The absolute simplicity of the syntax opens up new worlds. Macros are easy and incredibly powerful. Code and data blur together and look like one tightly integrated program.
* I can write parsers, compilers, debuggers, and more very quickly because of the syntax. The resulting code is shockingly simple.
* For the problem of aesthetics: I barely notice the parentheses. Seriously, [have a look at my color theme](http://jlongster.com/s/sexp.png).
* For the problem of editing: No serious Lisp programmer edits parantheses manually. You use something like [Paredit](http://www.emacswiki.org/emacs/ParEdit), seen more [here](http://www.emacswiki.org/emacs/PareditCheatsheet) and [here](http://www.youtube.com/watch?v=hiwEm88xaxM&list=UUlmUI0PnpT5q_B4TsGNtOAg&index=6&feature=plcp).

I never will expect something like Outlet to be wildly popular, but I hope to create a small community at least.

_[Discuss this on Hacker News](http://news.ycombinator.com/item?id=3447481)_