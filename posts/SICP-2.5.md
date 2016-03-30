---
published: true
shorturl: "SICP-2.5"
tags: ["sicp"]
date: "December 14, 2011"
---

# SICP 2.5

Today I'm working through [exercise 2.5](http://mitpress.mit.edu/sicp/full-text/book/book-Z-H-14.html#%_thm_2.5) from [Section 2.1: Introduction to Data Abstraction](http://mitpress.mit.edu/sicp/full-text/book/book-Z-H-14.html#%_sec_2.1). The problem sounds intruiging to me.

I'll be honest: I couldn't figure it out. I knew how to do it, but I couldn't figure out the math to solve it. I looked up [the solution](http://community.schemewiki.org/?sicp-ex-2.5) and it took my a while to understand it. It was interesting enough that I still wanted to write about it!

The problem asks to implement the pair data structure (a container that holds elements `x` and `y`) as an integer that represents `2^x * 3^y`.

Implementing the `cons` procedure which creates the pair is easy:

```scheme
(define (cons x y)
  (* (expt 2 x) (expt 3 y)))
```

Now we need to implement `car` and `cdr` procedures which extract the first and second element. We need to solve for `x` and `y`.

I'm not sure what the mathematical solution is, but we can solve it with code. Here is the solution from [schemewiki](http://community.schemewiki.org/?sicp-ex-2.5), assuming that `expt` is an exponent procedure:

```scheme
(define (count-0-remainder-divisions n divisor) 
  (define (iter try-exp) 
    (if (= 0 (remainder n (expt divisor try-exp))) 
        (iter (+ try-exp 1))  ;; Try another division. 
        (- try-exp 1))) 
 
  ;; Start at 1, as 0 will obviously pass. 
  (iter 1)) 
 
(define (car z) (count-0-remainder-divisions z 2)) 
(define (cdr z) (count-0-remainder-divisions z 3)) 
```

It's a bit confusing, so let's dig through it. The key idea is that `2^x` will always produce an even number, while `3^y` will always produce an odd number. If we need to find `x`, we can test each iteration of `2^1 .. 2^n` and when the consed integer divided by `2^n` produces a remainder, we know that `x=n-1` which is the last divisible number. We can do the same thing for `y`.

Say we have `(cons 3 4)`. Our representation turns into:

```
(cons 3 4)
(2^3) * (3^4)
(2*2*2) * (3*3*3*3)

(2*2*2)     <- always even
(3*3*3*3) <- always odd
```

An even number is never divisible by an odd number, and vice versa. Knowing this, we can iteratively test values for `x` or `y` like this:

```scheme

;; Test equation, where %= means "the remainder equals"
(2*2*2) * (3*3*3*3) / (2^i) %= 0

i=1

(2*2*2) * (3*3*3*3) / 2 %= 0
(2*2) * (3*3*3*3) / 1 %= 0
;; True

i=2

(2*2*2) * (3*3*3*3) / (2*2) %= 0
2 * (3*3*3*3) / 1 %= 0
;; True

i=3

(2*2*2) * (3*3*3*3) / (2*2*2) %= 0
3*3*3*3 / 1 %= 0
;; True

i=4

(2*2*2) * (3*3*3*3) / (2*2*2*2) %=0
(3*3*3*3) / 2 %= 0
;; False
```

We know the last equation is false because an odd number is never divisible by 2. So `x` is `i-1` at the point of the last iteration, which is 3. Because we also know that an even number is never divisible by an odd number, you can deduce `y` the same way.

This works:

```scheme
(define a (cons 40 76))

(car a)
40

(cdr a)
76
```

Clever.

*Update*: A friend pointed out [on twitter](http://twitter.com/#!/asandroq/status/147247719650574336) that it's not so much about even/odd numbers, but about [prime factorization](http://en.wikipedia.org/wiki/Prime_factor). This makes sense because 2 and 3 are prime numbers, and concepts here would work with any primes. Thanks for pointing out the real definition of this!