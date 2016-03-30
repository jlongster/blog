---
tags: ["outlet","cps","noteworthy"]
published: true
date: "May 11, 2012"
readnext: "The-Quest-for-Javascript-CPS--Part-2"
abstract: "I implemented CPS in Outlet and benchmarked the result, as seen here. It's very slow, but is there a way to optimize it?"
shorturl: "Compiling-to-Javascript-in-CPS,-Can-We-Optimize-"
headerimg: ""
---

# Compiling to Javascript in CPS, Can We Optimize?

It's been interesting to work on a Lisp->Javascript compiler for the past few months. ClojureScript has quickly evolved into a really powerful and fast language during the same time. What does this mean for [Outlet](https://github.com/jlongster/outlet/)? For now, Outlet is just research. I think there's lots of room in this space, and many things that still need to be looked into.

For example, I've recently been working on integrating [continuation-passing style (CPS)](http://en.wikipedia.org/wiki/Continuation-passing_style) transformation into the Outlet compiler. It's working so far. Not only has this been a mind-blowing experience, it opens up lots of opportunties. It would be easy to create lots of debugging tools, including an in-browser stepping debugger. CPS effectively lets us control the stack of the application, even in non-blocking environments like the browser.

I'm only interested in CPS for debugging, not in production code. There is an inherent performance hit with it, which I'm not willing to accept in production. The language itself will not support `call/cc` or other explicit continuation mechanisms. _(This may change, depending on how large the penalty is, as having run-time continuations would be interesting too)_

## Now, the gory details!

My CPS work can be found on the [CPS branch](https://github.com/jlongster/outlet/tree/cps,) specifically the [CPS transformer](https://github.com/jlongster/outlet/blob/cps/cps.ol.) It is a modified form of Christian Queinnec's from [Lisp In Small Pieces](http://www.amazon.com/Lisp-Small-Pieces-Christian-Queinnec/dp/0521562473,) section 5.9.

I'm not going to explain it in detail, but I'll give a rough overview. The main function is `cps`, which takes an expression and transforms it into CPS:

```scheme
(define (cps e)
  (if (or (atom? e)
          (dict? e)
          (vector? e))
      (lambda (k) (k e))
      (case (car e)
        ((require) (lambda (k) `(begin ,e ,(k ''void))))
        ((throw) (lambda (k) `(begin ,e ,(k ''void))))
        ((quote) (cps-quote (cadr e)))
        ((if) (cps-if (cadr e)
                      (caddr e)
                      (if (null? (cdddr e))
                          #f
                          (car (cdddr e)))))
        ((begin) (cps-begin (cdr e)))
        ((set!) (cps-set! (cadr e) (caddr e)))
        ((define) (cps-define (cadr e) (cddr e)))
        ((lambda) (cps-abstraction (cadr e) (cddr e)))
        (else (cps-application e)))))
```

The individual transformation functions, `cps-if`, `cps-begin`, etc., return a function that takes a syntactic continuation. Here's `cps-quote`:

```scheme
(define (cps-quote data)
  (lambda (k)
    (k `(quote ,data))))
```

So the calling convention is to CPS code and pass in a function expecting the result. In a strangely circular way, explicitly using CPS in the transformer makes it easy to CPS code. This is because it structures the syntactic forms in the transformer in a similar way to the generated code.

Here is `cps-if`:

```scheme
(define (cps-if bool form1 form2)
  (lambda (k)
    ((cps bool)
     (lambda (b)
       `(if ,b
            ,((cps form1) k)
            ,(if (== form2 #f)
                 (k ''void)
                 ((cps form2) k)))))))
```

You can see how individual forms are CPS-ed, such as `bool`, the conditional expression. We call `cps` on it and call the result with a function that expects the syntactual result.

This isn't a CPS tutorial, so I'm not going to explain the technique any further. If you're interested, check out the [source](https://github.com/jlongster/outlet/blob/cps/cps.ol) of the transformer.

This is a small example of what code this should generate.

```scheme
((cps '((lambda (x) (+ x 1)) 5))
 (lambda (r)
   `((lambda ()
       (pp (str "halted with result: " ,r))
       #f))))

;; output:

((lambda (o1 x)
   (o1 (+ x 1)))
 (lambda (o2)
   ((lambda ()
      (pp (str "halted with result: " o2))
      #f)))
 5)
```

## Making it work

One does not simply CPS transform code and expect it to work. There are a few things I had to tweak to get it running.

#### Trampolines

Javascript is not [tail call optimized (TCO)](http://en.wikipedia.org/wiki/Tail_call,) so if every statement calls into a continuation, we will quickly run out of stack space. A common fix for this is using something called a "trampoline". Instead of calling into a continuation, the function returns the continuation and the trampoline calls into it. The trampoline is a simple while loop:

```javascript
var v = func();
while(v) { v = v(); }
```

Since calling a continuation technically never returns anything, we can guarantee that what we _are_ getting back is a function.

Technically, we don't return the continuation itself but a function that calls the continuation, allowing us to capture any variables in scope.

#### Side Effects

The biggest difficulty was dealing with side effects. `set!`, `require`, and other forms are meant to have side effects, and it's illegal to use them as arguments to functions in Outlet. CPS assumes that all expressions will have a result that is passed into the next continuation. This is a problem.

I used an ugly hack to fix this. Instead of passing in a `set!` form to the syntactic continuation, I generate a `begin` form that calls `set!` and then runs the code returned from the syntactic continuation, passing `void` as the result. Here is `cps-set!`:

```scheme
(define (cps-set! var form)
  (lambda (k)
    ((cps form)
     (lambda (a)
       `(begin
          (set! ,var ,a)
          ,(k ''void))))))
```

The same goes for `define`. This allows us to use javascript scoping of variables.

<a id="results"></a>
## Results & Performance

The result is [Outlet](https://github.com/jlongster/outlet) code which is CPS-ified and compiled to Javascript. The issue isn't getting it to run, but getting it to run fast. CPS code creates a function for every single statement, which will cause tons of allocations and performance problems. But how bad is it?

First, let's start with an example program:

```scheme
(define (add x y)
  (+ x y))

(define (sub x y)
  (- x y))

(define (bar x)
  (sub x 1))

(define (foo x)
  (if (> x 0)
      (add 1 (foo (bar x)))
      x))

(foo 100)

;; output:

"halted with result: 100"
```

After CPS, it looks like this:

```js
(cps-trampoline
 (cps-jump
  (lambda
   ()
   ((lambda
     (o1)
     ((lambda
       ()
       (define
        add
        (lambda
         (o3 x y)
         (cps-jump
          (lambda () (o3 (+ x y))))))
       ((lambda
         (o2)
         ((lambda
           ()
           (define
            sub
            (lambda
             (o5 x y)
             (cps-jump
              (lambda () (o5 (- x y))))))
           ((lambda
             (o4)
             ((lambda
               ()
               (define
                bar
                (lambda
                 (o7 x)
                 (cps-jump
                  (lambda
                   ()
                   (sub
                    (lambda
                     (o8)
                     (cps-jump (lambda () (o7 o8))))
                    x
                    1)))))
               ((lambda
                 (o6)
                 ((lambda
                   ()
                   (define
                    foo
                    (lambda
                     (o10 x)
                     (if
                      (> x 0)
                      (cps-jump
                       (lambda
                        ()
                        (bar
                         (lambda
                          (o11)
                          (cps-jump
                           (lambda
                            ()
                            (foo
                             (lambda
                              (o12)
                              (cps-jump
                               (lambda
                                ()
                                (add
                                 (lambda
                                  (o13)
                                  (cps-jump
                                   (lambda () (o10 o13))))
                                 1
                                 o12))))
                             o11))))
                         x)))
                      (cps-jump (lambda () (o10 x))))))
                   ((lambda
                     (o9)
                     (cps-jump
                      (lambda
                       ()
                       (foo
                        (lambda
                         (o14)
                         (cps-jump
                          (lambda () (o1 o14))))
                        100))))
                    (quote void)))))
                (quote void)))))
            (quote void)))))
        (quote void)))))
    (lambda
     (o15)
     ((lambda
       ()
       (pp
        (str
         "halted with result: "
         o15))
       #f)))))))
```

Finally, compiled to Javascript:

```js
cps_dash_trampoline(
cps_dash_jump((function() {
    return ((function(o1) {
        return ((function() {
            var add = (function(o3, x, y) {
                return cps_dash_jump((function() {
                    return o3((x + y));
                }));
            });
            return ((function(o2) {
                return ((function() {
                    var sub = (function(o5, x, y) {
                        return cps_dash_jump((function() {
                            return o5((x - y));
                        }));
                    });
                    return ((function(o4) {
                        return ((function() {
                            var bar = (function(o7, x) {
                                return cps_dash_jump((function() {
                                    return sub((function(o8) {
                                        return cps_dash_jump((function() {
                                            return o7(o8);
                                        }));
                                    }), x, 1);
                                }));
                            });
                            return ((function(o6) {
                                return ((function() {
                                    var foo = (function(o10, x) {
                                        return (function() {
                                            if ((x > 0)) {
                                                return cps_dash_jump((function() {
                                                    return bar((function(
                                                    o11) {
                                                        return cps_dash_jump((function() {
                                                            return foo((function(o12) {
                                                                return cps_dash_jump((function() {
                                                                    return add((function(o13) {
                                                                        return cps_dash_jump((function() {
                                                                            return o10(o13);
                                                                        }));
                                                                    }), 1, o12);
                                                                }));
                                                            }), o11);
                                                        }));
                                                    }), x);
                                                }));
                                            } else {
                                                return cps_dash_jump((function() {
                                                    return o10(x);
                                                }));
                                            }
                                        })();
                                    });
                                    return ((function(o9) {
                                        return cps_dash_jump((function() {
                                            return foo((function(o14) {
                                                return cps_dash_jump((function() {
                                                    return o1(o14);
                                                }));
                                            }), 100);
                                        }));
                                    }))("\uFDD1void");
                                }))();
                            }))("\uFDD1void");
                        }))();
                    }))("\uFDD1void");
                }))();
            }))("\uFDD1void");
        }))();
    }))((function(o15) {
        return ((function() {
            pp(str("halted with result: ", o15));
            return false;
        }))();
    }));
})));
```

This does not bode well. That's quite a lot of code for a simple program, with tons of extra functions. The trampoline forces us to create a few extra functions as well. Let's throw this into jsperf and see how it performs.

I created 3 different tests: non-CPS, naive CPS without the trampoline, and CPS with trampoline. [View the test here (and run it!)](http://jsperf.com/cps/2.) Here are the results on Firefox:

* non-cps: 265,000 ops/sec
* cps: 550 ops/sec
* cps-tramp: 2000 ops/sec

Yikes! This shouldn't be surprising with all the extra functions we are creating. If you profile this with the Chrome profiler, it's clear that we're thrashing the GC:

![](http://jlongster.com/s/gc.png)

Interestingly, the trampoline helps a lot on Firefox, presumably because allocation functions deep in the stack is slower. It didn't help much on Chrome though.

*Here's my challenge to all you CPS experts*: is there _any_ way of optimizing this? I know there are more efficient CPS conversions, but do you think it will go far enough to get it to run much better? I'm ok if it were 5x as slow, but the above performance is abysmal.

*My one idea* is to hoist every single lambda into the global environment and make them named functions. We need to pass around an environment and manually construct variable scoping but that's not hard. I think this would help a lot because it avoids lots of allocations when looping. The cost of function allocation is constant when the program loads, and there's no more overhead when looping.

I would love to have CPS-ed code just for debugging. If we get this to work, I'm even interested in doing the same thing to ClojureScript, which would open up a lot of debugging possibilities. [Let me know](http://twitter.com/jlongster) if you can help out!
