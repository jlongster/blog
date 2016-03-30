---
shorturl: "making-web-games-3d-engine"
tags: ["js","games","game-off"]
published: true
date: "November 15, 2012"
---

# Making Web Games #3: 3d Engine


*This is part of a series documenting my game development process for Github's [Game Off](https://github.com/blog/1303-github-game-off). Check out the past posts:*

* [Watch Me Develop a Game for Github's Game Off](/developing-games-for-github)
* [Game Off Update #1: Graphics](http://jlongster.com/Game-Off-Update--1--Graphics)
* [Making Web Games #2: Loading Meshes](http://jlongster.com/making-web-games-loading-meshes)

*Play the latest version [here](http://jlongster.com/s/game-off-2012/) and give some feedback by commenting on this post!*

A lot has been going through my brain recently. This tends to happen when I get excited about something, especially when I have real working code in front of me.

Games are particularly exciting to me because I love the visual response. I can see a literal manifestation of the code I'm writing. I get excited thinking about how helpful this could be for teaching programming. Then I start thinking of all the real-time editing possibilities, and I've lost all focus on the original task. Isn't there a syndrome for this?

I know I need to focus, but really this whole thing is just a chance for me to explore some ideas I've been thinking about for a long time. So my geeky technical adventure is more important to me than actually finishing a game. I don't really care about winning an iPad. I care about exploring and hacking on cool ideas, hopefully inspiring others to do the same.

A reasonable person would use an existing 3d engine like [three.js](https://github.com/mrdoob/three.js/). They probably would use existing tools like Blender to lay out levels and game play. I'm not feeling reasonable these days. WebGL could use more people diving deep into it, and I intend to do just that.

In light of that, I'm introducing a 3d engine called [Shade](https://github.com/jlongster/shade). I'm using it for my game, and it's very new, and therefore simple. Simplicity can be very good though, as long as its performant.

![](/s/game-off-2012-screens/3.png)

> *A scene graph test, each box is a child of the one next to it and every box is rotated each frame, so the rotations compound ([view](http://jlongster.com/s/game-off-2012-3/index.html))*

The best way to learn something is to **build it**. If you want to know how compilers work, build one. Actually, don't build *one*, build **many**. Don't be afraid to constantly throw away work and start from scratch. The end product will be very high quality and driven by practical experience if you work that way.

Shade may be just one iteration in my adventure to build 3d engines, or it may be something I focus on and slowly build over time. I don't know yet. Either way, I have something that works great for my game right now, and I can build all kinds of cool features quickly.

![](/s/game-off-2012-screens/4.png)

> *Another scene graph test, 1000 boxes rotating around one parent node ([view](http://jlongster.com/s/game-off-2012-3/index2.html))*

Shade comes with:

* Utilities for loading .obj files
* Utilities for constructing dynamic meshes
* A scene graph for constructing 3d scenes
* A renderer to optimally render the scene graph
* Various other utility functions

It has no collision detection yet, which is the biggest missing feature. Although it's not really a graphics engine job, I need it for my game. Once I finish this feature, I think my game engine is complete, and I need to write the actual game mechanics.

You might recognize the above screenshots. They are actually three.js [examples](http://mrdoob.github.com/three.js/examples/webgl_geometry_hierarchy2.html) that I [ported](http://mrdoob.github.com/three.js/examples/webgl_geometry_hierarchy.html) to my engine to make sure performance is on par. It's also a good way to compare APIs. I plan on porting a bunch more examples over after the Game Off is over.

Back to the first point in this post: I'd love it if I could fly around these scenes, pick apart objects, see their code, and change their code *in real-time*. This is much like Bret Victor's ideas, [Light Table](http://www.chris-granger.com), and others. We live in the age of interactive code, and I think we need to start applying them here.

Recently I saw [Aardwolf](http://lexandera.com/aardwolf/), a custom javascript debugger that hijacks the javascript in the browser and lets you set breakpoints and step through the code. This inspired me to set aside a night and hack on [an idea](https://github.com/jlongster/YPS) for compiling javascript in a way that I could control it real-time in my 3d scene. More to come on this.

As you can probably tell, I've pretty much just been geeking out recently. And I'm loving it. I have about two weeks to finish a full game, so next week I'm going to start on the game mechanics.
