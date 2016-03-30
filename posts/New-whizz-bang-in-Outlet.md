---
published: true
shorturl: "New-whizz-bang-in-Outlet"
tags: ["outlet"]
date: "February 16, 2012"
---

# New whizz-bang in Outlet

_[Outlet](https://github.com/jlongster/outlet) is a [Lisp](https://github.com/jlongster/outlet/blob/master/tests/syntax.ol)-[like](https://github.com/jlongster/outlet/blob/master/tests/core.ol) language that compiles to javascript that supports in-browser eval and macros_

I've been quiet lately. But not completely dead, I promise. I've been working on a complete rewrite of the Outlet compiler. The good news is that it's finished! The bad news is that I'm not as far along in the development of the language as I'd like.

Outlet needed a complete rewrite, badly. I knew it within a week of writing the first version. I became painfully aware how little I knew of compilers and how to properly abstract code in them. Version 1 (let's call it Mudpit) was an absolute mess. Expansion and parsing intermingled with each other, the javascript generator was parsing ASTs for breakfast, and monkeys ruled the jungle. Mudpit was trying to be a house, but it was really just a ball of mud.

Version 2 is nice. It's 100% Outlet except for the runtime (which is still a mess, but that's easy to clean up). I thought deeply how expansion and parsing danced together, how to represent ASTs, what to pass the javascript generator, etc. I built a strong foundation that will be able to support a lot of cool stuff in the future. (Take a look at the [compiler](https://github.com/jlongster/outlet/blob/master/compiler.ol) and [js generator](https://github.com/jlongster/outlet/blob/master/backends/js.ol).)

**[Try it now in the browser](http://jlongster.com/s/outlet)**

## Nice Things that Came Out of this Rewrite

* **Expansion** The code is fully expanded first, and then parsed. This means you can tell Outlet to just expand the code and then stop so you can look at it. In fact, you can tell it exactly how many times to expand to code so you can watch each step (see [expand-nth](https://github.com/jlongster/outlet/blob/master/compiler.ol#L102))

* **Eval** `eval` is still supported and its [implementation](https://github.com/jlongster/outlet/blob/master/compiler.ol#L338) is much cleaner.

```scheme
(eval '(foo (+ 1 2)))
```

* **Data Structures** Vectors and dicts are handled better, and have fewer bugs. You can write them like `[1 2 3 'foo]` and `{:one 1 :two 2}`.

```scheme
(define vec [1 2 3 4 'five])
(define obj {:one 1 :two 2 :three 3})
(define obj-copy (zip (keys obj) (vals obj)))
```

* **Lua Backend** The parser handles the complexity of compiling, and the javascript generator only needs to support a few basic semantics. This will make it easy to build the Lua backend.

* **Macros** Experimental support for [EPS macros](http://citeseer.ist.psu.edu/viewdoc/summary?doi=10.1.1.50.4332) is introduced. This macro system is much more powerful than `define-macro`, and in fact the latter is implemented in terms of the former. Outlet supports them strongly, as [most forms](https://github.com/jlongster/outlet/blob/master/compiler.ol#L208)  are implemented as EPS macros. However, I say "experimental" because I'm not completely convinced they are useful enough.

```scheme
(define-expander (begin form e)
  (e `((lambda () ,@(cdr form))) e))
```

* **Debugging** Of course, right after I say that EPS macros aren't useful, Outlet supports some cool debugging now because of them. You can implement a [tracer](https://gist.github.com/1840230) is very few lines of Outlet macros. However, I'm still not convinced this is the route I want to go down.

The interesting thing about running the tracer in the browser is that if you use `alert` you can actually block code execution, so you "step" through your code! It's a pretty ugly way of doing it, but interesting nonetheless. **[Try it out now](http://jlongster.com/s/outlet)* by copying this code into the web REPL:

```scheme
(require (trace "./trace"))
(trace.set-prompt alert)

(trace-source (let ((i (+ 4 5)))
                (+ i (* 2 (/ 3 4)))))
```

If you don't want to try it out, here's what the tracer will print (if you don't use `alert` to block the tracer):

```scheme
(trace-source (let ((i (+ 4 5)))
                (+ i (* 2 (/ 3 4)))))


;; Output

(let ((i (+ 4 5)))
 (+ i (* 2 (/ 3 4))))
-- (+ 4 5)
>> RESULT: 9
-- (+ i (* 2 (/ 3 4)))
---- (* 2 (/ 3 4))
------ (/ 3 4)
>>>>>> RESULT: 0.75
>>>> RESULT: 1.5
>> RESULT: 10.5
RESULT: 10.5
```

* **Tests** [More](https://github.com/jlongster/outlet/blob/master/tests/syntax.ol) [tests](https://github.com/jlongster/outlet/blob/master/tests/core.ol) have been added.

## Other Things I've Learned

* **Quasiquoting** Quasiquoting is a special form in Lisp that quotes an element but allows you to unquote and/or splice in other elements inside it. I won't explain it here, but I discovered that you can implement quasiquoting as a [macro](https://github.com/jlongster/outlet/blob/master/compiler.ol#L254). This simplifies it a lot! Previously, the js generator was aware of quasiquoting, but now it's not at all.

* **Debugging Macros** Debugging macros suck, and it's really important to build in proper pretty printing and step-wise expansion facilities early on.

* **Bootstrapping Early** Don't bootstrap too early. I did with Outlet and it was a pain to track down certain errors. I'm glad it's bootstrapped now but I could have waited a bit.

## Download Outlet

You can download Outlet on [github](https://github.com/jlongster/outlet) and view the README for usage instructions. Issues and patches are welcome!

_[Discuss this on Hacker News](http://news.ycombinator.com/item?id=3599416)_