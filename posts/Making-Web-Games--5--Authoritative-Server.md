---
tags: ["js","games","game-off"]
published: true
date: "November 26, 2012"
readnext: ""
abstract: "Now that I have a multiplayer server working for my WebGL FPS, I improve it to become an \"authoritative server\". It runs client-side prediction and interpolation to keep gameplay smooth but reject any cheating."
shorturl: "Making-Web-Games--5--Authoritative-Server"
headerimg: ""
---

# Making Web Games #5: Authoritative Server

*This is part of a series documenting my game development process for Github's [Game Off](https://github.com/blog/1303-github-game-off). Check out the past posts:*

* [Watch Me Develop a Game for Github's Game Off](/developing-games-for-github)
* [Game Off Update #1: Graphics](http://jlongster.com/Game-Off-Update--1--Graphics)
* [Making Web Games #2: Loading Meshes](http://jlongster.com/making-web-games-loading-meshes)
* [Making Web Games #3: 3d Engine](http://jlongster.com/making-web-games-3d-engine)
* [Making Web Games #4: Multiplayer Networking](http://jlongster.com/Making-Web-Games--4--Multiplayer-Networking)

*Play the latest version [here](http://jlongster.com:4000/) and give some feedback by commenting on this post!*

So here we are, the last week of github's game off. I still haven't even started level design, heck, I haven't even implemented shooting yet. But, with a lot of work, I think I'll be able to pull something off really fun.

My theory is that if I focus on the core parts of the game and make it really solid, I can make some fun gameplay on top of it in a few days. Ideally I would flesh out the gameplay more, but it's all good.

<iframe width="600" height="450" src="http://www.youtube.com/embed/HG1S0KdcVHs" frameborder="0" allowfullscreen></iframe>

If you don't care to read the rest of this post, at least watch the video above. I explain the same things in the video.

The most complex part of a multiplayer first person shooter (FPS) is the networking aspect. Things happen really fast and you need to make sure all the players are in sync. Additionally, you need to secure the server so that players can't easily spoof information about where they are in the world, and other important info.

Unfortunately, doing this requires a completely different architecture. The gist of it is that you make the server authoritative by simulating the game on the server, and clients become simply a display window into the game, showing it as fast as possible.

When a player presses a key, the *key* is sent to the server and the server moves the player. However, in order to avoid lag, you must implement something called [client-side prediction](http://en.wikipedia.org/wiki/Client-side_prediction) so input is responded to instantly.

Additionally, you need something called "entity interpolation" to make other player's movements smooth. There are several other optimizations in the architecture to make things fast and accurate.

[This series of articles](http://www.gabrielgambetta.com/?p=11) was extremely helpful for me. He explains all these concepts very clearly.

You can watch the above video for how all this is interacting in my current game.

**I can now finally implement shooting, head shots, and basic levels!** Now that the client/server architecture is robust, I don't think that should take very long.