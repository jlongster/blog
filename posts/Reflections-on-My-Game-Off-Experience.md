---
tags: ["games","js","game-off"]
published: true
date: "December 10, 2012"
readnext: "Making-Sprite-based-Games-with-Canvas"
abstract: "After an intense few weeks building a multiplayer first person shooter on the web, I take a look at what I achieved and what I did wrong."
shorturl: "Reflections-on-My-Game-Off-Experience"
headerimg: ""
---

# Reflections on My Game Off Experience

Github's [game off](https://github.com/blog/1303-github-game-off) has come and gone. I ended up with [Octoshot](http://octoshot.jlongster.com/), a multiplayer game where you run around in a 3d world and shoot each other. I'm posting this a week after the competition ended because I desperately needed a break from computers if I wasn't going to burn out. I stayed up until 3-4 AM the nights leading up to the end, and all the way to 7 AM the night before it ended!

![](/s/game-off-2012-screens/final-1.png)

> *A screenshot of the final game. Kill other players as much as you can in 5 minutes!*

After a long nap, I woke up to the disappointing realization that the game just isn't fun. I spent so much time getting the multiplayer working that I didn't have time to integrate cool weapons and effects.

I'm very happy with the game technically; it's robust <sup><a href="#footnote1">[1]</a></sup> and the multiplayer tech behind it is impressive, in my opinion. There is a lot more I can do with an authoritative multiplayer server. But I just ran out of time.

![](/s/game-off-2012-screens/final-2.png)

> *Implementing quadtrees in the game for collision detection and frustum culling*

I was honestly a little depressed after the competition ended because lots of other games were getting noticed but mine wasn't. Every now and then a player would join, run around for a few seconds, and quit. If only he/she knew the cool tech going on underneath all of this! We're all playing on a game server! Alas, this is why content is so important. It's a classic case of spending all the time on the platform and not the content. 

Live and learn.

*(To all my coworkers at Mozilla: thanks for playing the game a good bit and all the encouragement!)*

![](/s/game-off-2012-screens/final-3.png)

> *The in-game chat system allows you to post media URLs to embed images, videos, and all kinds of stuff thanks to [webremix](https://github.com/ednapiranha/node-webremix).*

I enjoyed the experience though, and I'm one step closer to understanding how good games are made. There's also a ton of potential in the underlying code which implements a 3d engine, authoritative multiplayer server, a full chat system, and more. If I fleshed out the game more I'm confident that I could be on to something.

In fact, I was **blown away** at how easy it was to write a good chat system. This is why it's so great to make games on the web! [Watch this part of my development video](http://youtu.be/uc5vWBU543A?t=1m12s) to see what I mean.

Finally, here's a short video that demos the multiplayer functionality (the blue boxes are bounding boxes, ignore the fact that the player's box is not aligned correctly):

<iframe width="420" height="315" src="http://www.youtube.com/embed/AdkUhARV3pk" frameborder="0" allowfullscreen></iframe>

## Next Steps

I'm *very* interested in writing a game development environment for the web. It was my goal in 2012 to learn more about compilers, games, and development environments to equip myself with the necessary experience. I think I've achieved that.

With that in mind, I don't plan on fleshing out Octoshot into a detailed, complicated game. Instead, it will most likely become a test case for my next project.

When developing abstract tools, it's very important for features to be born from practical needs. You need to put yourself in the user's shoes as often as possible, and constantly challenge your tool with real-world expectations and use cases. Octoshot will allow me to dogfood my own (future) project.

I've learned a lot this past year, and there are several things I'd like to change soon, including this blog and other stuff. Stay tuned!

## Development Posts and Videos

In case you haven't been following, I blogged my development of Octoshot in the following posts. I didn't have time to go over everything, but you can see a high-level overview of my game development process:

* [Watch Me Develop a Game for Github's Game Off](/developing-games-for-github)
* [Game Off Update #1: Graphics](http://jlongster.com/Game-Off-Update--1--Graphics)
* [Making Web Games #2: Loading Meshes](http://jlongster.com/making-web-games-loading-meshes)
* [Making Web Games #3: 3d Engine](http://jlongster.com/making-web-games-3d-engine)
* [Making Web Games #4: Multiplayer Networking](http://jlongster.com/making-web-games-networking)
* [Making Web Games #5: Authoritative Server](http://jlongster.com/making-web-games-authoritative-server)

<sup id="footnote1">[1] Well, the collision resolution sucks and you can walk through walls. But at least you can walk through walls consistently.</sup>