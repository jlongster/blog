---
published: true
shorturl: "Outlet-gets-Macros"
tags: ["outlet"]
date: "January 13, 2012"
---

# Outlet gets Macros

Tonight, I compiled the [first Outlet macro](https://github.com/jlongster/outlet/blob/macros/example.ol#L37). I hacked together [a quick implementation](https://github.com/jlongster/outlet/commit/c8fd643a6ee62c5a9ff04a14bcd9bcff7465522d) of `define-macro` and it works! The last thing it really needs is quasiquote syntax, which is a more enhanced form of quoting that lets you splice in data (essentially choosing which terms to eagerly evaluate). This is greatly helpful when writing macros.

I basically compile the macro at compile-time into js code and `eval` it into a function object, and apply the forms as needed. Extremely dumb, but suprisingly effective.

If you haven't used macros before, you can learn more [here](http://www.apl.jhu.edu/~hall/Lisp-Notes/Macros.html) and [here](http://www.apl.jhu.edu/~hall/Lisp-Notes/Macros.html). They are really powerful in Lisp because the syntax is so dang easy to parse. There are several different macro systems that each have advantages, but `define-macro` is the simplest.

Using `define-macro`, you can expand a form at compile-time into something else. So if you want to make event handling code cleaner, you could do this:

```scheme
(define-macro (define-event args . body)
  `(install-event ,(car args)
                  (lambda ,(cdr args)
                    ,@body)))

(define-event (touch-block block)
  (if (should-explode block)
      (explode block)
      (kill-player)))

;; expands to:

(install-event 'touch-block
               (lambda (block)
                 (if (should-explode block)
                     (explode block)
                     (kill-player))))
```

The ability to extend the syntax is very, very powerful. Eventually, Outlet might implement its debugger **purely as macros**. This isn't possible with `define-macro`, but [something a little more powerful](http://citeseer.ist.psu.edu/viewdoc/summary?doi=10.1.1.50.4332).

Note that Outlet doesn't support the quasiquote syntax (that's the ` and , you see in the macro definition) or the dot syntax for lists. This will come soon.

After polishing up this macro system, I can start leveraging them within the compiler since most of it is written in Outlet. This will let me iterate features of the language much quicker since they are just macros. Right now, the Outlet compiler isn't very moduler and I need to break up the dependencies. Implementing the few basic rules of Scheme semantics and letting macros implement the language features will be a great separation.

