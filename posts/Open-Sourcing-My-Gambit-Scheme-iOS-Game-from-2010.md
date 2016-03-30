---
tags: ["scheme","ios"]
published: true
date: "March 8, 2014"
readnext: ""
abstract: "Back in 2009-2010, I got Gambit Scheme running on iOS and decided to build a game with it. The result was Farmaggedon, a stupid game where you blow up farm animals to avoid being hit by them."
shorturl: "Open-Sourcing-My-Gambit-Scheme-iOS-Game-from-2010"
headerimg: "http://jlongster.com/s/post-headerimgs/farmageddon.png"
---

# Open-Sourcing My Gambit Scheme iOS Game from 2010

Back in 2009-2010, I got [Gambit Scheme](http://gambitscheme.org/wiki/index.php/Main_Page) running on iOS and decided to build a game with it. The result was Farmaggedon, a stupid game where you blow up farm animals to avoid being hit by them.

I blogged about my progress working with Scheme on iOS back then and evidently a lot of people were inspired by it. [This](http://jlongster.com/s/jlongster-old/pages/blog/write-apps-iphone-scheme.html) was the main blog post, in addition to a bunch of videos. Recently [another iOS game](https://news.ycombinator.com/item?id=7361947) was featured on Hacker News that was written in Gambit Scheme, and it inspired me to dredge up the source of my game and completely [open source it](https://github.com/jlongster/farmageddon) and talk about it.

![](http://jlongster.com/s/farmaggeddon/farmageddon.jpg)

## Background

I used to work with [Lang Martin](https://twitter.com/langmartin) and [Ben Weaver](https://twitter.com/bwvr) at a small webdev shop right out of college. They were a little older than me and far more technically grounded than I was at the time. Occasionally I would hear "lisp" and "scheme" murmured around the office while trying to focus on my C++ game engine side project, and I thought they were just trying to sound cool.

Boy was my mind about to be blown. Eventually we all decided to play around with Scheme and see if we could use it internally. I knew nothing about it, but I tried to keep up with the conversation and more often than not ended up saying foolish things. Tired of feeling out of my depth, I committed to studying Scheme and it still influences me to this day. This is why it's *so* important to surround yourself with people smarter than you. I got lucky.

Fast-forward a few years later, I was feeling burned out at my job and decided to quit and try freelancing. I set aside the first few months to try and make an iOS game (this was right around the time iOS was exploding). Having fallen in love with Scheme, I endeavoured to make a game with Scheme and prove that it can be practical and performant, as well as making you more productive.

And so I made Farmageddon.

![](http://jlongster.com/s/farmaggeddon/farmageddon2.jpg)

## Show Me the Source!

Enough talking, [here's the source](https://github.com/jlongster/farmageddon). You're looking at a completely unfiltered, raw project. Everything I was thinking of is in there somewhere. You're also looking at the messiest project with the worst code, ever.

I was so naïve back then. Set aside a couple *months* to build a game from scratch, including porting a whole language to a completely new platform? Are you kidding me?

I ported Gambit Scheme to iOS, which basically just means cross-compiling with the right options and writing the necessary FFIs. The actual port wasn't too much work, which was exciting but dangerous because it blinded me to the fact that *I would have to build everything myself*. Not only was I lacking an OpenGL rendering library, I didn't even have access to the OpenGL API. I had to write [an FFI](https://github.com/jlongster/farmageddon/blob/master/src/ffi/gl.scm) for that. (Actually, I wrote a [Scheme program](https://github.com/jlongster/autoffi) that parsed C++ header files and auto-extracted it.)

Additionally, I created sounds, 3d models, game mechanics, user interfaces, and a basic 3d engine. See all the resources [here](https://github.com/jlongster/Farmaggedon/tree/master/resources). I did hire a local designer to make some really cool gritty nuclear farm graphics for the game, but everything else I did myself. Which is why the game is terrible.

Regardless of how badly Farmageddon failed commercially, it was one of the most transformative experiences of my life. I learned tons about project scope, marketing, games, and a lot of other stuff. But even more, I got to experience working in a minimal but powerful language that I could shape to my needs, with a REPL/debugger always there to incrementally play with things.

It wasn't just continuations, green threads, macros, records, and tail-call optimizations that made me a better programmer. It was the idea of incremental development, where you could always redefine a function at run-time to try something new, or inspect and change any data structure. We've come close to that with browser devtools, but the experience still isn't quite what it should be.

So if you haven't aready, you really should learn a Lisp. Personally I like [Gambit](http://gambitscheme.org/wiki/index.php/Main_Page), but [Chicken](http://www.call-cc.org/) and [Racket](http://racket-lang.org/) are really good too. [Clojure](http://clojure.org/) is great too, just a different flavor because it's not a minimal Scheme. It doesn't matter. Learn one of them.

## Development Videos

These are some videos I made showing off the real-time REPL and debugger. The first two were the most popular.

<iframe width=640" height="390" src="//www.youtube.com/embed/Q7c0rU9Lv28" frameborder="0" allowfullscreen></iframe>

<iframe width="640" height="390" src="//www.youtube.com/embed/p6k7fjOjqZw" frameborder="0" allowfullscreen></iframe>

<iframe width="640" height="390" src="//www.youtube.com/embed/h_mul5bFRBU" frameborder="0" allowfullscreen></iframe>

There are a [few](https://www.youtube.com/watch?v=-CqY9fufVr8) [other](https://www.youtube.com/watch?v=Xv89BrqQvOc) [ones](https://www.youtube.com/watch?v=Fcut5__ZrSg) as well.

![](http://jlongster.com/s/farmaggeddon/farmageddon3.jpg)

## Source Commentary

The code is incredibly messy, but I feel warm and nostalgic looking at it. There are a few interesting things to point out about it.

1. Most of the Obj-C code is in [`src/app`](https://github.com/jlongster/farmageddon/tree/master/src/app). The entry point is in [main.m](https://github.com/jlongster/farmageddon/blob/master/src/app/main.m) which initializes and configures the Gambit virtual machine. [`EAGLView.mm`](https://github.com/jlongster/farmageddon/blob/master/src/app/EAGLView.mm) is where most of the code lies to interact with the iOS UI.

2. The main entry point for Scheme is in [`src/init.scm`](https://github.com/jlongster/farmageddon/blob/master/src/init.scm). At that bottom of the file are two FFI functions: `c-init` and `c-render`. Those are exposed as `init` and `render` at the C level and the Obj-C code calls into them.

3. All of the FFIs are in [`src/ffi`](https://github.com/jlongster/farmageddon/tree/master/src/ffi). I think I wrote most of them by hand, and auto-generated a few of them. What's need about Gambit is that you can embed any kind of C/C++/Obj-C code. For example, [here](https://github.com/jlongster/farmageddon/blob/master/src/ffi/view.scm) is the FFI for invoking methods in the iOS view for changing the UI. The scheme methods embed Obj-C code straight into them. You can see more of this in the [iOS FFI](https://github.com/jlongster/farmageddon/blob/master/src/ffi/iphone.scm) which lets me allocate native iOS data structures. Lastly, you can see my attempts at optimizations by [converting Scheme vectors](https://github.com/jlongster/farmageddon/blob/master/src/ffi/arrays.scm) into native C arrays.

4. The main game loop is in [`farmageddon.scm`](https://github.com/jlongster/farmageddon/blob/master/src/farmageddon.scm). Most of the work is in the various [screens](https://github.com/jlongster/farmageddon/tree/master/src/screens), like [`level.scm`](https://github.com/jlongster/farmageddon/blob/master/src/screens/level.scm) which renders and updates the main game.

5. The main component of the game engine is in [`src/lib/scene.scm`](https://github.com/jlongster/farmageddon/blob/master/src/lib/scene.scm). I used Gambit's native record types and wrote a macro to generate fields that dynamically dispatched of the type for making game entities.

6. All of my [tests](https://github.com/jlongster/farmageddon/tree/master/src/tests) were simply top-level Scheme code that I live evaluated when the game was running. No automation for me!

7. Gambit has a powerul cooperative threading system, and I [used it extensively](https://github.com/jlongster/farmageddon/blob/master/src/events.scm#L132). The game and sound system each had a thread and would send messages to the main thread for changing the game state. Each level had a thread running to fire off events at random intervals, and I [could simply call](https://github.com/jlongster/farmageddon/blob/master/src/events.scm#L132) `thread-sleep!` to wait for a certain period. Note that these aren't real threads, just cooperative so it was all safe.

8. The remote debugger is in the [`emacs`](https://github.com/jlongster/farmageddon/tree/master/emacs) directory and my Emacs integration was called [grime](https://github.com/jlongster/farmageddon/blob/master/emacs/remote-debugger/grime.el). Since I had a live REPL to my game in Emacs, I even wrote [helper functions](https://github.com/jlongster/farmageddon/blob/master/emacs/animattack.el) in Emacs to change game state and bound them to keys so I could quickly invoke them.

There's a lot more in there, and like I said it's *very* messy. But there's a lot of gems in there too. I hope it continues to inspire others.
