---
published: true
shorturl: "SICP-2.6--Church-Numerals"
tags: ["sicp"]
date: "December 26, 2011"
---

# SICP 2.6: Church Numerals


I've been exploring [exercise 2.6](http://mitpress.mit.edu/sicp/full-text/book/book-Z-H-14.html#%_thm_2.6) from SICP. I didn't plan on diving into it this much, but I found it more enlightening than I expected.

In [2.5](/2011/12/14/sicp-25.html) we worked through representing pairs as procedures. 2.6 asks us to implement *numbers* as procedures. What?

This is called [Church Numerals](http://en.wikipedia.org/wiki/Church_numeral), and it's how you do arithmetic in [lambda calculus](http://en.wikipedia.org/wiki/Lambda_calculus). Lambda calculus is a formal system for programming entirely in lambdas. It turns out to be incredibly powerful, but more as an academic/enlightning exercise. I don't know anyone who uses it in production, but it really opens up your eyes.

Exercise 2.6 shows how to represent `zero` and an `add-1` procedure in church numerals:

```scheme
(define zero
  (lambda (f)
    (lambda (x) x)))

(define (add-1 n)
  (lambda (f)
    (lambda (x)
      (f ((n f) x)))))
```

This takes a little getting used to. There's two parts to it: `f` and `x`. `f` is the function that will be applied `n` times, and `x` is the item to operate on. The two lambdas *could* be combined, but formal lambda calculus dictates that only single arguments can be used (of course, multiple arguments can be represented with lambdas). To represent a number procedurally, it looks like the following:

```scheme
;; 4
(lambda (f)
  (lambda (x)
    (f (f (f (f x))))))

;; That's why zero is just
(lambda (f)
  (lambda (x) x))
```

Exercise 2.6 asks us to define `one` and `two`.

```scheme
(define one
  (lambda (f)
    (lambda (x)
      (f x))))

(define two
  (lambda (f)
    (lambda (x)
      (f (f x)))))
```

I know I kind of spoiled that be the previous code block, but we are here to complete the exercises, aren't we?

The last step of the exercise is the implement an `add` procedure which adds church numerals. First, let's take a look at the given `add-1` procedure.

```scheme
(define (add-1 n)
  (lambda (f)
    (lambda (x)
      (f ((n f) x)))))
```

If we substitute `((n f) x)` with just `x`, you see that it's identical to our definition of `one`. So what does the former expression mean? That's how you *apply* a church numeral. You pass it a function, which returns a function that will be applied `n` times which takes an item to operate on. So we're applying the current church numeral, adding one more function application to it ("add one"), and wrapping all of that into another function which is the final result.

Now we have two church numerals and we need to add them together.

```scheme
(define a one)
(define b two)

;; Numeral application
((a f) x)

;; Concrete example which prints "hello" two times
;; We return x because the result is passed to the next iteration
((b (lambda (x)
      (print x)
      x))
 "hello")

;; Add a and b by applying a to the result of applying b
(define (add a b)
  (lambda (f)
    (lambda (x)
      ((a f) ((b f) x)))))
```

We basically "execute" `b` first and pass the result to `a` and execute it. Applying both numerals is the same as adding them; adding 1 and 2 creates a function that will be applied 3 times. It's simply function composition.

```scheme

(define seven (add three four))

((seven (lambda (x)
          (print x)
          x))
 "hello")

hello
hello
hello
hello
hello
hello
hello
```

We can continue to define `subtract` and other algebraic operations, and it's all expressed in procedures!

Let's implement conversions from church numerals to integers.

```scheme
;; Church to integer is simply integer addition
(define (church->integer f)
  ((f (lambda (x)
        (+ x 1))) 0))

;; integer to church requires that we start with a zero church
;; numeral and add one i-times
(define (integer->church i . n)
  ;; treat the second parameter as the accumulator, which is
  ;; null on the first call (so we start with zero)
  (let ((n (if (null? n)
               zero
               (car n))))
    (if (= i 0)
        n
        (integer->church
         (- i 1)
         (lambda (f)
           (lambda (x)
             (f ((n f) x))))))))


```

Now we can convert back and forth and it's easy to test our holy church functions (har har). Let's build a `range` procedure on top of numerals for the fun of it.

```scheme

;; first, test our conversion functions
(((integer->church 20)        
  (lambda (x) (+ x 1)))
 0)
20

(church->integer (integer->church 100))
100

;; range
(define (range x y step)
  (lambda (f)
    (((integer->church (+ (- y x) 1))
      (lambda (x)
        (f x)
        (+ x step))) x)))

((range 0 10 1)
 (lambda (x) (print x)))
0
1
2
3
4
5
6
7
8
9
10

((range 5 10 2)
 (lambda (x) (println (* x 2))))
10
14
18
22
26
30

```

Why is this neat? We don't have to depend on any numerical system builtin to our environment to do arithmetic, looping, and implement other constructs. The main point is to expose new ideas about representing your data and to think differently, even if you would never actually write code this way (the performance would suck, even if you could get rid of the lambdas).

Additional Exercise
-------------------

When using procedures to work with church numerals, you get a lot of lambda cruft. Look at the `integer->church` function, it wraps every single procedure in a lambda! That's inherently dog-slow, of course, and any decent compiler would remove those lambdas.

I propose an additional exercise: write `integer->church` as a macro which generates a church numeral without an additional `lambda`s.

```scheme
;; so instead of this
(integer->church 4)

;; generating this
(lambda (f)
  (lambda (x)
    (f (((lambda (f)
           (lambda (x)
             (f (((lambda (f)
                    (lambda (x)
                      (f (((lambda (f)
                             (lambda (x)
                               (f (((lambda (f) (lambda (x) x)) f) x))))
                           f)
                          x))))
                  f)
                 x))))
         f)
        x))))

;; it generates this, which is the equivalent
(lambda (f)
  (lambda (x)
    (f (f (f (f x))))))
```

Here's my implementation of it. I'm not going to explain macros in this post, so don't worry about it if you haven't worked with macros. As I said before, any decent Scheme would automatically optimize the code this way, and I'm interested in looking in to that in the future.

```scheme
(define-macro (define-for-macros args . body)
  (eval `(define ,args ,@body)))

(define-for-macros (%integer->church i . n)
  (let ((n (if (null? n)
               'x
               (car n))))
    (if (= i 0)
        n
        (%integer->church
         (- i 1)
         `(f ,n)))))

(define-macro (integer->church i)
  `(lambda (f)
     (lambda (x)
       ,(%integer->church i))))

;; if we change the above to simply `define`, we can see what it
;; outputs
(integer->church 4) ; ->
(lambda (f)
  (lambda (x)
    (f (f (f (f x))))))
```

[Email me](mailto:jlongster@jlongster.com) if you have any questions or comments!
