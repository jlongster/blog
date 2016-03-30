---
published: true
shorturl: "SICP-1.35"
tags: ["sicp"]
date: "December 13, 2011"
---

# SICP 1.35

I'm starting to work through the exercises in [Structure and Intrepretation of Computer Programs](http://mitpress.mit.edu/sicp/), also known as SICP. The book is engaging and teaches what I think is the fundamentals of Computer Science. Every programmer should learn at least a few things from this book.

It's Lisp-oriented, but only because Lisp's syntax provides the clearest explanation for what's going on. Anything you learn from here will be of great benefit even if working in Python or any other language. It should come as no surprise: Lisp is the foundation for a huge amount of programming languages today (Javascript, Ruby, Python, Java, and others).

Today I worked on [exercise 1.35](http://mitpress.mit.edu/sicp/full-text/book/book-Z-H-12.html#%_thm_1.35) in [Section 1.3.3: Procedures as General Methods](http://mitpress.mit.edu/sicp/full-text/book/book-Z-H-12.html#%_sec_1.3.3).

We're looking at using procedures as general methods, and in the book they show how to find fixed points of functions with a procedure. For some functions, we can find a fixed point by starting with a guess and repeatedly applying it to the function until it doesn't change very much.

The book provides this implementation of the `fixed-point` procedure:

```scheme
(define tolerance 0.00001)
(define (fixed-point f first-guess)
  (define (close-enough? v1 v2)
    (< (abs (- v1 v2)) tolerance))
  (define (try guess)
    (let ((next (f guess)))
      (if (close-enough? guess next)
          next
          (try next))))
  (try first-guess))
```

For example, we can now find the fixed point of the `cos` method:

```scheme
(fixed-point cos 1.0)
.7390822985224023
```

Exercise 1.35 asks us to show that the golden ratio (`1.6180...`) is a fixed point of the function `y = 1 + 1/x`. We can test this with the following code. I modified the `fixed-point` procedure to output every guess at each step.

```scheme
(fixed-point (lambda (x) (+ 1 (/ 1 x)))
             1)
1.
2.
1.5
1.6666666666666667
1.6
1.625
1.6153846153846154
1.619047619047619
1.6176470588235294
1.6181818181818182
1.6179775280898876
1.6180555555555556
1.6180257510729614
1.6180371352785146
1.618032786885246

(fixed-point (lambda (x) (+ 1 (/ 1 x)))
             1000)
1000.
1.001
1.999000999000999
1.5002498750624689
1.66655562958028
1.6000399760143913
1.6249843847595253
1.615390528905289
1.6190453528767905
1.6176479233414656
1.6181814878075371
1.6179776542586042
1.6180555073600345
1.618025769481522
1.6180371282469985
1.6180327895710356
```

We can see how the the fixed point of the function is indeed the golden ratio value. Obviously the `fixed-point` procedure is primitive and wouldn't handle certain functions, but this is just exemplifying using procedures as general methods. You could implement procedures to derive and integrate functions similarly.