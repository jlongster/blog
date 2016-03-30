---
published: true
shorturl: "Outlet-gets-a-Personality"
tags: ["outlet"]
date: "January 16, 2012"
---

# Outlet gets a Personality

If you haven't been following, [Outlet](https://github.com/jlongster/outlet) is a project I've been working on that compiles a Scheme-inspired language to javascript and other languages. You can see the initial announcement and demo [here](http://jlongster.com/2012/01/04/outlet-my-lisp-to-javascript-experiment.html).

Up until now, I've been getting a simple compiler going. I needed to feel out what it looked like to translate Scheme into javascript and implement features like macros and eval. So far, it's turned out great. In only ~1000 lines of code, you can implement the basic Scheme semantics and macros. Check out the [compiler](https://github.com/jlongster/outlet/blob/master/compiler.ol) and [generator](https://github.com/jlongster/outlet/blob/master/compiler-js.js) to get the idea (I'm fully aware that it's bad code and the semantics are hacky at best).

Now that I have a working Outlet compiler, and I understand how to write compilers better, it's time to sit back and think about how I really want Outlet to look. This is where the fun begins.

To kick this off, I wrote some [documentation](/s/outlet-docs/semantics.html) and [tests](https://github.com/jlongster/outlet/blob/0521763581fb8588afadb3ca8d55bbd597a9888c/tests/compile.ol). This helps solidify how the system works right now. I even found and fixed some serious bugs in the process.

If you look at the [documentation](/s/outlet-docs/semantics.html), Outlet supports most of the basic building blocks of a language. What it really needs now is more data structures and control constructs to doing things quickly.

[Clojure](http://clojure.org/) is inspiring, especially its [syntax](http://clojure.org/reader) for working with data structures. I'm borrowing a lot from it, and mixing it in with Scheme. Yummy.

### Lists

Outlet already supports a basic list structure. You can make lists with `list` like `(list 1 2 foo)`, and quoted lists with `'` like `'(1 2 3)`. `car`, `cdr`, and `cons`, are implemented. But that's all.

We need to flesh out this API a little bit. I'm thinking of something like this: `list`, `list?`, `cons`, `car`, `cdr`, `cadr` ..., `lref`, `llen`

The ellipses after `cadr` implies that all the combinations of `car` and `cdr` is available up to four levels, such as `cadr`, `caddr`, `cdddr`, etc.

The [Scheme SRFI](http://srfi.schemers.org/srfi-1/srfi-1.html) for lists offers several interesting functions. I'm not sure how much to include here. Considering that [Clojure's list API](http://clojure.org/data_structures#Data%20Structures-Lists%20%28IPersistentList%29) doesn't include very much, I'm thinking of making it simple. I'll likely add a few more functions though.

```scheme
(list 1 2 3)
(list foo bar)
'(1 2 3 4) ; quoted short syntax

(define a (cons 1 2))  ; -> '(1 . 2)
(list? a)              ; -> #t
(car a)                ; -> 1
(cdr a)                ; -> 2

(define a '(1 2 (3 4))
(car (cdr a))          ; -> 2
(cadr a)               ; -> 2
(caddr a)              ; -> '(3 4)
(cdddr a)              ; -> '()

; reference and length
(lref a 3)             ; -> '(3 4)
(llen a)               ; -> 3
```

### Vectors

Vectors provide fast random access, but slow insertion. This is oversimplified, but you get the point.

Scheme usually provides the syntax `#(1 2 3 4)` for creating vectors. It's analagous to the `'` quoting operator to create lists. It also has the property that all elements are quoted, meaning that variables are seen as symbols rather than being evaluated. To create a non-quoted vector, you use `(vector 1 2 3 4)` just like `list`.

I don't like how verbose `vector` is just to create a non-quoted vector. I really like how Clojure [handles](http://clojure.org/reader#The%20Reader--Reader%20forms) this. It supports the normal square bracket syntax for creating vectors, and you can quote it: `[1 2 3]`.

Possible API: `vector`, `make-vector`, `vector?`, `vlen`, `vref`, `vset!`, `vinsert!`, `vpush!`, `vslice`, `vsplice!`

```scheme
(define foo 1)
(define bar 2)

[1 2 3]           ; -> [1 2 3]
[foo bar]         ; -> [1 2]
'[1 2 3]          ; -> [1 2 3]
'[foo bar]        ; -> ['foo 'bar]
(make-vector 4 0) ; -> [0 0 0 0]

;; API
(define v [0 0 0 0])
(vector? v)               ; -> #t
(vlen v)                  ; -> 4
(vset! v 1 4)             ; -> null, v would be [0 4 0 0]
(vref v 1)                ; -> 5
(vinsert! v 2 5)          ; -> [0 4 5 0 0]
(vpush! v 6)              ; -> [0 4 5 0 0 6]
(vslice v 1 2)            ; -> [4 5]
(vsplice v 1 #(7 8))      ; -> [0 7 8 4 5 0 0 6]
```

### Maps

Maps are like Python's dictionaries and Javascript's hashes. Again, I like the syntax Clojure [implements](http://clojure.org/reader#The%20Reader--Reader%20forms), so I'm copying it.

The traditional way to do maps in Scheme is "assocation lists", which is a list of pairs like `'(("one" . 1) ("two" . 2))`. It's cool that you can implement maps in pure Scheme, but in reality that is quite cumbersome.

Clojure uses the curly braces and introduces a "keyword" type, which is like a symbol. I'm not entirely sure what the differences are, but for now I'm treating it as a symbol. Keywords are prefixed with a `:`, like `:one`. We can build maps like so: `{:one 1 :two 2}`. As always, you can quote it.

Possible API: `mref`, `mset!`, `mlen`, `mkeys`, `mvals`, `mzip`

```scheme
(define foo 1)
(define bar 2)

{:one 1 :two 2}      ; -> {:one 1 :two 2}
{:one foo :two bar}  ; -> {:one 1 :two 2}
'{:one foo :two bar} ; -> {:one 'foo :two 'bar}

(define m {:one foo :two bar})
(mref m :one)            ; -> 1
(mset! m :one 5)         ; -> null, m would be {:one 5 :two 2}
(mlen m)                 ; -> 2
(mkeys m)                ; -> [:one :two]
(mvals m)                ; -> [5 2]
(mzip [:biz :baz] [8 9]) ; -> {:biz 8 :baz 9}
```

### Conclusion

There are many other data structures we could include, like sets, ordered maps, etc. I want to focus on providing a few, strong features, and I think the above structures is a solid foundation. I'm sure I'll add more over time as I see the need for it.

This is all subject to change, of course. Please [let me know](http://twitter.com/jlongster) what you think of this syntax or these apis!