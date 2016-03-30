---
shorturl: "making-web-games-loading-meshes"
tags: ["games","js","game-off"]
published: true
date: "November 9, 2012"
---

# Making Web Games #2: Loading Meshes


*This is part of a series documenting my game development process for Github's [Game Off](https://github.com/blog/1303-github-game-off). Check out the past posts:*

* [Watch Me Develop a Game for Github's Game Off](/developing-games-for-github)
* [Game Off Update #1: Graphics](http://jlongster.com/Game-Off-Update--1--Graphics)

*Play the latest version [here](http://jlongster.com/s/game-off-2012/) and give some feedback by commenting on this post!*

[Yesterday](http://jlongster.com/Game-Off-Update--1--Graphics) I showed you how I'm piecing together the basic framework for my web game. An important first step is to get some 3d triangles on the screen and a little camera action. I achieved this with a terrain that you can walk over. Hooray!

However, as fun as it is to walk over terrain, we really need to support all kinds of 3d objects. First, I refactored the code into proper modules. I now have a `Renderer` class that manages objects and renders them accordingly. I'm starting to separate the lower-level glue code with the game code.

Now, what I really need is the ability load **load arbitrary 3d meshes**. I did some research and this [webgl-loader library](http://code.google.com/p/webgl-loader/) looks really promising. It compiles 3d objects in the .obj format into some weird compact [UTF-8 representation](http://jlongster.com/s/game-off-2012/resources/ben.mesh) (think bytes as UTF-8 code points, or something like that). You then load the mesh with ajax and parse the string byte by byte. My UTF-8 knowledge is rusty so that's all I'm gonna say about this, but it seems like an awesome hack to make loading and parsing of meshes much faster than verbose text formats.

It also comes with a few examples which really helped to get it working quickly. Here's a character in my 3d scene:

![](/s/game-off-2012-screens/2.png)

You can [play it live](http://jlongster.com/s/game-off-2012/), too! The controls are pretty crappy, but it works for now.

That model came with the library as an example. I'm rendering it wireframe for now, but soon I will load in the normals as well and have proper shading. That's for another post!

I'm pleasantly surprised at the performance so far in modern browsers. I still have plenty of room to do a lot of other calculations and renderings.

## Game Concept

Initially, I was going to do a hybrid 2d/3d game where the 3d scene was a sort of "courtyard" that led to other dimensions, which were all 2d task-based games. It seems a bit silly though to do that after investing so much in my 3d framework.

I really want my game to be social. We are talking web games, right?! So I think I'm just going to do a first person shooter. But probably with some kind of twist. More to come.

## Recommended Libraries

Here are the important libraries used so far. I recommend them if you are doing game programming for the web.

* [simplex-noise.js](https://github.com/jwagner/simplex-noise.js): An implementation of simplex noise, a faster algorithm than Perlin Noise
* [gl-matrix](https://github.com/toji/gl-matrix): High-performance matrix and vertex calculations using typed arrays
* [webgl-loader](http://code.google.com/p/webgl-loader/) .obj mesh loader with a compact precompiled step

I would write more technical details about *how* to use these libraries and *why* they are cool, but I don't have time. I have 3 weeks to finish my game, damnit! I'm thinking of writing more detail tutorials when the game off is over.

*If you'd like to see more of my progress, [follow my blog](http://feeds.feedburner.com/jlongster) to see more posts!*

*[Discuss on Hacker News](https://news.ycombinator.com/item?id=4765270)*