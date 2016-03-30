---
published: true
shorturl: "Lisp--It-s-Not-About-Macros,-It-s-About-Read"
tags: ["macros"]
date: "February 18, 2012"
---

# Lisp: It's Not About Macros, It's About Read

_Note: the examples here only work with [outlet](https://github.com/jlongster/outlet) lisp. Refer to your version of lisp/scheme's documentation for how `read` works (and possibly other forms)_

I know it's an old post by now, but something about the article [Why I love Common Lisp and hate Java, part II](http://kuomarc.wordpress.com/2012/02/02/why-i-love-common-lisp-and-hate-java-part-ii-code-examples/) rubbed me the wrong way. The examples just aren't that good. The usage of macros is plain baffling, when a function would have been fine. The author admits this, but still does it. There's a [follow-up post](https://kuomarc.wordpress.com/2012/02/13/why-i-love-common-lisp-and-hate-java-part-iii-macros/) which focuses more on macros but it _still_ misses the point.

Here's the thing: it's not really about macros.

Lisp's advantage runs deeper than that. Let's stop throwing macros in other people's faces (and saying we're the only ones to get "itchy" to abstract things). They're not going to understand anyway because it's something you have to experience for yourself. It's all the more confusing when a normal function would be fine. "Why do you need a macro? I can abstract the same thing with a function!"

It's not about macros, it's about `read`.

`read` is a builtin function in most Lisps that reads an object. An object can be any kind of atom (number, string, etc.), or a data structure like a list. Here are a few examples:

```scheme
(read "3") ; 3
(read "foo") ; 'foo
(read "\"foo\"") ; "foo"
(read "(foo bar baz)") ; (list 'foo 'bar 'baz)
```

Wait a second, if you take a look at Lisp code, it's really _all_ made up of lists:

```scheme
(define (foo x)
  (+ x 1))
```

Once you understand that Lisp code is data (lists of atoms), you realize that you can use `read` to read in Lisp code as data. And since Lisp comes with a set of functions for elegantly processing lists, suddenly it's really easy to parse Lisp code.

Here's an example:

```scheme
;; program.lisp

(define (foo x)
  (+ x 1))

;; our parser

;; get-file-contents returns a file's contents as a string
;; (defined elsewhere)
(define src (get-file-contents "program.lisp"))

;; src is a string, turn it into data
(define forms (read src))

;; `car` retrieves the first item of a list
(display (car forms)) ; 'define

;; `cons` puts an item at the beginning of the list
;; `cdr` gets the rest of the list after the first item
;; `cadr` is a combination, equal to (car (cdr x))
;; `cddr` is a combination, equal to (cdr (cdr x))
(let ((name-args (cadr forms)))
  (cons 'lambda
        (cons (cdr name-args)
              (cddr forms))))

;; output: (lambda (x) (+ x 1))
```

You just wrote a parser that turns all `define` expressions into `lambda` expressions.

That should impress you. How would you do that in Python? Or Javascript? You need access to the AST and need to learn all the internal methods for parsing it. Lisp code _is_ an AST.

Think of `read` like `JSON.parse` in Javascript. Except since Javascript code isn't the same as data, you can't parse any code with `JSON.parse`. In Lisp, it's all the same.

## Macros

So what are macros? All they are is `read` packaged up nicely into formal system. You can install macros as functions in the compiler. The compiler reads in the program as data, and "expands" it by parsing it and looking for macro calls. When it hits one, it passes the program source as data to your macro, and you can do whatever you want with it. You give back the compiler some data which it continues parsing as code.

If you're not convinced yet, this might help. **You can implement a macro system in [30 lines of Lisp](https://gist.github.com/1712455)**. All you need is `read`, and it's easy.

## So What's the Point?

I really don't want to this to be a "Lisp is awesomer than your language" kind of post. Each language has its benefits. Use what you like.

I hope this helps explain why Lisp folks rave about macros. It's indicative of a deeper power that actually lies in the fact that Lisp code is data (and vice-versa). If you ever find yourself curious about it, I encourage you to follow it. You just might find something you like.

A few examples of what you can do with this: debugging tools become really easy to write (i.e. [a tracer](https://gist.github.com/1840230) in ~40 lines). Unit tests can keep track of the original expression which failed, so it can show exactly what happened. Lots of other possibilities that I can't dive into here.

I love this quote from Paul Graham's post "[Beating the Averages](http://www.paulgraham.com/avg.html)":

> "The source code of the Viaweb editor was probably about 20-25% macros. Macros are harder to write than ordinary Lisp functions, and it's considered to be bad style to use them when they're not necessary. So every macro in that code is there because it has to be. What that means is that at least 20-25% of the code in this program is doing things that you can't easily do in any other language. However skeptical the Blub programmer might be about my claims for the mysterious powers of Lisp, this ought to make him curious."

Don't think of this on a micro-scale, where you are trying to see if a certain function would be better as a macro. Think of this on a macro-scale, where you can write a full parser to do something crazy to your code if needed. It would only be ~50 lines anyway. _That_ is what other languages can't do.

_[Discuss this on Hacker News](http://news.ycombinator.com/item?id=3607248)_