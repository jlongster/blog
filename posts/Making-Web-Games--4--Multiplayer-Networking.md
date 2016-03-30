---
shorturl: "Making-Web-Games--4--Multiplayer-Networking"
tags: ["js","games","game-off"]
published: true
date: "November 23, 2012"
abstract: "First person shooters aren't very fun unless you can play with other people. In this article I show how I implemented a basic multiplayer server for my game."
---

# Making Web Games #4: Multiplayer Networking



*This is part of a series documenting my game development process for Github's [Game Off](https://github.com/blog/1303-github-game-off). Check out the past posts:*

* [Watch Me Develop a Game for Github's Game Off](/developing-games-for-github)
* [Game Off Update #1: Graphics](http://jlongster.com/Game-Off-Update--1--Graphics)
* [Making Web Games #2: Loading Meshes](http://jlongster.com/making-web-games-loading-meshes)
* [Making Web Games #3: 3d Engine](http://jlongster.com/making-web-games-3d-engine)

*Play the latest version [here](http://jlongster.com:4000/) and give some feedback by commenting on this post!*

This is a quick post to show something big that I finally implemented: multiplayer networking! Players can connect to the server and you can see them walking around on the terrain. You can also chat with them! Check out the following video, and play it [here](http://jlongster.com:4000):

<iframe width="600" height="450" src="http://www.youtube.com/embed/uc5vWBU543A" frameborder="0" allowfullscreen></iframe>

Thanks to ednapiranha's [webremix](https://github.com/ednapiranha/node-webremix) library, the chat window is insanely fun. All media links turn into *actual media*, so you can embed images, youtube, rdio, mixcloud urls, and more. **This is what gaming on the web should be like!** In case you can't watch the video, here's what the chat window looks like. The boxes you see are other players in the game.

![](/s/game-off-2012-screens/chat.png)

The client/server architecture is really powerful for games. It divides the work up into modular components. For example, bots are now just separate processes that talk to the server, instead of embedded code directly calling the game API.

I'm glad I implemented this before I do any of the game mechanics, as it tends to affect how everything works together. Next up: shooting and death and blood!