---
shorturl: "Game-Off-Update--1--Graphics"
tags: ["game-off"]
published: true
date: "November 8, 2012"
---

# Game Off Update #1: Graphics


*This is part of a series documenting my game development process for Github's [Game Off](https://github.com/blog/1303-github-game-off). Check out the past posts:*

* [Watch Me Develop a Game for Github's Game Off](/developing-games-for-github)

I *have* been working on my game. It's still in the early stages, but I'm hoping after I lay the groundwork that I will work faster. I'll be posting more at that point too. (I've also been out of town this week.)

I spent probably too much time figuring out what technology to use. I played around with [LLJS](http://lljs.org) to see what performance wins it gives, and it's not clear that it will give me enough to worry about in this tight timeframe. The biggest win is that it removes almost all GC pauses, but I think I can simplify my game so that modern browsers are fast enough <sup><a href="#footnote1">[1]</a></sup>.

I even played around with [emscripten](https://github.com/kripken/emscripten) and considered working with an existing C++ engine. But that would require a lot of effort to get to know an existing complex engine and how to bridge the APIs to javascript. Emscripten certainly makes it easy, but I only have a few weeks and I need to start writing code *now*!

In the end, I decided that I can write javascript fast enough (performance and time-wise) to make my game from scratch. This also makes it easily approachable to other web developers.

So here is what I have:

![](/s/game-off-2012-screens/1.png)

It's a basic terrain using WebGL from scratch. I didn't use [three.js](https://github.com/mrdoob/three.js/) because I'm really used to OpenGL and I want to get to know WebGL specifically. I used three.js at first, but the amount of work to figure it all out is too much right now.

Two libraries that I've found very helpful so far:

* [simplex-noise.js](https://github.com/jwagner/simplex-noise.js): An implementation of simplex noise, a faster algorithm than Perlin Noise
* [gl-matrix](https://github.com/toji/gl-matrix): High-performance matrix and vertex calculations using typed arrays

The pixelation is on purpose. I'm considering integrating the pixelated aesthetic with a 3d game. I think it looks really cool, and also removes a lot of work with detailed 3d stuff.

I also sat down and ran through ideas for a specific game mechanic. I'm not exactly sure what it will be like, but I have an opening scene in mind that I really like and I'm simply going to pursue that. It will most likely be some sort of strategy game.

**My next step**: Flesh out the engine code with basic 3d collision detection, and nail down a game mechanic.

<sup class="footnote" id="footnote1">
[1] I think LLJS has a bright future and certainly opens the door to writing javascript that's even more efficient than hand-tuned code. In my early testings, it's just not clear that at this point it would provide enough improvements for my simple game.
</sup>