---
published: true
shorturl: "Flame--My-2d-Game-Experiment"
tags: ["games"]
date: "December 30, 2011"
---

# Flame: My 2d Game Experiment

When I was in middle school, I discovered that I could _program_ my TI-82 graphing calculator. This was an exciting alternate activity to the classes which constantly failed to hold my attention. Soon enough, I was programming my way through math and science classes (I rarely cheated, it just sped up homework 10 fold).

I had so much spare time in school that I eventually programmed a full RPG game on the calculator which I named L.O.R.D. (Legend of the Red Dragon, after a popular MUD). I probably should have paid more attention in school, but on the bright side I was doing something constructive. In fact, in some ways it launched my programming career.

<div class="figure"><em>L.O.R.D.</em></div>
![](/img/lord.png)

Obviously, it was still a work in progress. I remember getting it polished though, and had ambitions to sell it to my classmates, until I realized it would just be pirated like crazy (you can easily transfer programs across TI-82s). The code grew so large that it filled up the entire calculator's memory (which I think was 32K) and when debugging took minutes for it to show me the line of the error.

I coded on an Apple II before this, but I consider this my first real program. It's appropriate that it was a game, as the creativity of games has always held my fascination. As a good kid who grew up in the 80's and 90's, I played all the classics from Zelda to Metroid.

In short, I like coding games. I continued to learn throughout high school how 3d games were made and spent several years working with OpenGL. This field is so fascinating to me for several reasons, and I'd like to start playing around with it again.

## It began with a Flame

The problem is that I've never really learned how to architect a game. I've learned a bunch of technical details, but never how to architect a complete system for running a game and all that comes with it.

In order to get more experience, I'm writing a web-based game called [Flame](https://github.com/jlongster/flame). See it running [here](http://jlongster.com/s/game/) (graphics will completely change).

![](/img/flame.png)

A few initial notes and goals:

* Dynamic languages like Javascript and Python are fantastic tools for prototyping designs. I can quickly code up an engine and heavily tweak it within hours.
* Every single game engine has "tasks" which are like cooperative threads (never running in parallel, but interleaved). They come in various forms, but games have so much going on that the only sensible thing is to express them as tasks and specify how to prioritize them.
* Every single game engine also has "events" which are basically tasks, but with a specific API. All games have events in them, such as when a player touchs a block, hits his enemy, etc.

The implementation of tasks and events vary wildy, some taking more of an event-driven approach and others acting more sequentially. It seems natural to leverage Javascript's event-driven architecture, which is exactly what [flame does right now](https://github.com/jlongster/flame/blob/master/lib/events.js) although that may change.

## task.js

A new library on the market for dealing with async tasks is [task.js](http://taskjs.org/) (by [Dave Herman](http://calculist.org/)). It is an awesome sweet spot between preemptive threading and continuation passing style (a.k.a. callback style). You can write code synchronously, but use javascript's `yield` keyword to give up control in the middle of a function. A scheduler can use this to do cooperative multitasking.

This really is a robust solution, as `yield` can replace _any_ expression in javascript. For example:

```javascript
var foo = yield bar();
var foo = (yield bar()) + 10;
var foo = bar(yield);
```

I'm seriously considering writing a game engine using this technique, though it would be Firefox-only (for now). As a research project, that's ok.

Tasks and events are at the core of a game engine, and is what I will be studying for the next few weeks. I plan to study other game engines (in C++ and other languages) to see how they are designed.

[Subscribe to my blog](http://feeds.feedburner.com/jlongster) if you are interested in following my studies!

[Discuss this on Hacker News](http://news.ycombinator.com/item?id=3408518)