---
published: true
shorturl: "Outlet--My-Lisp-to-Javascript-Experiment"
tags: ["outlet"]
date: "January 4, 2012"
---

# Outlet: My Lisp to Javascript Experiment

<link rel="stylesheet" type="text/css" href="/css/outlet-demo.css" />

_tl;dr Outlet is a Lisp-like language I'm working on. Download it [here](https://github.com/jlongster/outlet) and try the demo [below](#demo)._

Programming languages are interesting. We've created constructs out of nothing to enslave machines for our control. Code is mixing of semantics: legible enough for humans to understand, but structured enough for computers to interpret. It's a constant battle between us expressing ourselves cleanly and computers executing our code quickly.

While our machines are getting faster every year, really smart people are improving techniques for compiling our expressive code into machine speak. This means we can write beautiful, expressive code that is executed with speed and correctness. And **that** means we can build mountains and move rivers. Just look at what's happened in the past 10 years with the internet, mobile phones, ecommerce, etc.

## Javascript is Great

I love Javascript. Yes, it has problems, but the [Javascript that will be](https://developer.mozilla.org/en/New_in_JavaScript_1.7) (and is in current Firefox) is sexy. It's very succinct, functional, and powerful. Perhaps it comes as no surprise that I come from a Lisp background. Especially since Javascript was born from the ideas of Lisp (mainly Scheme).

However, I miss a lot from the Scheme world. Continuations, numeric towers, lists, and the like are all really cool. But what I **really** miss is the consistent S-expression syntax and macros. I miss writing bits and pieces of a compiler as my program demands it and having complete control over the language.

## Outlet is a Lisp-like Language

I'm excited to wet my toes in the compiler world with a new language called [Outlet](https://github.com/jlongster/outlet). Outlet is like Lisp, featuring S-expression syntax, but it doesn't aim to be Lisp or Scheme. At this point, it aims to simply compile to Javascript. Because of how similar Javascript is to Scheme, it's easy to get a Scheme-like language running with a simple source-to-source compiler.

Note that Outlet does _not_ aim to be "Javascript in Parentheses". Any resemblance is entirely due to Javascript's Scheme-ish nature. Javascript is simply the current backend.

I admittedly have grands visions for Outlet, but it's really a project to scratch my own itch. I love the web, but I don't want to build some projects in Javascript because I'd like to port them to other platforms. Outlet lets me explore a lot of cool ideas and maybe I'll end up with something useful.

<a id="demo"></a>
## Demo

Since Outlet compiles to Javascript, you can try it out now:

<div class="program">
  <textarea class="input">(define foo 5)</textarea>
  <div class="output"><pre></pre></div>
  <div class="compile"><input type="submit" value="Compile ->" /></div>
</div>

<div class="program">
 <textarea class="input">(define foo 5)

(define (bar x)
  (+ x 1))

(bar foo)</textarea>
  <div class="output"><pre></pre></div>
  <div class="compile"><input type="submit" value="Compile ->" /></div>
</div>

<div class="program">
  <textarea class="input">(define (buz x)
  (let ((y x)
        (add_1 (if (< x 0)
                   (lambda (n) (- n 1))
                   (lambda (n) (+ n 1)))))
    (add_1 y)))

(buz 10)</textarea>
  <div class="output"><pre></pre></div>
  <div class="compile"><input type="submit" value="Compile ->" /></div>
</div>

<div class="program">
  <textarea class="input">(define (string_split str c)
  (str.split c))

(string_split "hello\"world" "\"")
  </textarea>
  <div class="output"><pre></pre></div>
  <div class="compile"><input type="submit" value="Compile ->" /></div>
</div>

<div class="program">
  <textarea class="input">(let ((p ($ ".program")))
  (p.css "border" "1px solid green"))
  </textarea>
  <div class="output"><pre></pre></div>
  <div class="compile"><input type="submit" value="Compile ->" /></div>
</div>

You'll notice in the last example that we can call native functions on objects. This is a funny result from the fact that Scheme identifiers allow "." in them, and Outlet simply copies the name into the javascript code. Javascript then evaluates it like normal. I don't intend build anything on this though. If you want to write javascript, write javascript.

## Below the Hood

I chose to implement the compiler in Javascript. Eventually, all of it could be written in Outlet itself, so javascript is just the bootstrapping language.

While researching how to parse the S-expressions, I found this amazing [recursive descent parser](http://blog.oleganza.com/post/106246432/recursive-descent-parser-in-javascript) in javascript. You can write your parser in BNF-like rules straight in javascript. It's written functionally and avoids _all_ side effects, so it's really easy to backtrack (in fact, happens automatically). If a rule fails, simply return null, and it will backtrack to the last matching rule and simply continue on.

Using this advanced parser, it's easy to support escaped strings, number formats, quoting, and other special forms.

Checkout Outlet's [grammar](https://github.com/jlongster/outlet/blob/master/grammar.js) which use fed into the parser.

## Future features?

Macros are coming soon. They will make it easy to build a lot of features purely in Outlet.

For embedding in an app, I could compile Outlet to Lua. Lua has a good VM, and it's focus is on easy embedding, fast/real-time execution, and being lightweight. It even supports [yield](http://lua-users.org/wiki/CoroutinesTutorial) so I could keep coroutines in Outlet. Regardless, there's lots of cool languages I can compile Outlet too, possibly even C with some kind of VM.

My vision for Outlet is for it to grow into a domain-specific language. This will give it an edge for a specific field if it is **so** good at doing something specific. This might be games, I'm not sure, we'll see!

I realize this sounds ambitious, but you can do a lot with the Lisp-like languages. Since the code is _so_ easy to parse, you can do a lot with it quickly. [Follow along](http://feeds.feedburner.com/jlongster) if you'd like to see how far I can take it.

_Download Outlet [here](https://github.com/jlongster/outlet)._

_[Discuss this on Hacker News](http://news.ycombinator.com/item?id=3430406)_

<script src="http://jlongster.com/s/jlongster.com-util/jquery-2.1.0.min.js"></script>
<script type="text/javascript" src="http://jlongster.com/s/outlet-post/outlet.js"></script>
<script type="text/javascript" src="http://jlongster.com/s/outlet-post/outlet-demo.js"></script>

