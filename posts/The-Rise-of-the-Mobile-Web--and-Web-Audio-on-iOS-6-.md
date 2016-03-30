---
published: true
shorturl: "The-Rise-of-the-Mobile-Web--and-Web-Audio-on-iOS-6-"
tags: []
date: "September 12, 2012"
---

# The Rise of the Mobile Web (and Web Audio on iOS 6)

*tl;dr I built a [cool demo](http://jlongster.com/s/touch.html) using Web Audio API (you will only hear audio in Chrome and the new iOS/Safari 6). You can see a video [here](http://www.youtube.com/watch?v=ZRLEBu2LQe4). The mobile web is coming.*

[Recent posts](http://techcrunch.com/2012/09/11/mark-zuckerberg-our-biggest-mistake-with-mobile-was-betting-too-much-on-html5/) have been [discussing](https://plus.google.com/113127438179392830442/posts/fR3iiuN4kEF) the web as a [platform for apps](http://raganwald.posterous.com/the-web-is-still-the-place). Currently, native apps are more popular on mobile devices, but the idea is that the web should be able to overtake the mobile market just like it did the desktop. This isn't really a reply to those discussions, but something did prompt me to write this.

I went to a [Startup Weekend](http://startupweekend.org/) this past weekend in Richmond, VA, where I live. It was a good experience. Tech meetups don't happen very often in Richmond, and I work from home, so it's always nice to get some exposure to what other developer's are doing.

With all the native vs web discussion going on, it struck me how most startups were still based on the web (let's not forget that!). The only few exceptions were mobile-focused companies, of course. There was one particular team that developed a touch-based interactive musical app on the iPad. The iPad is an obvious choice for that project. For some reason, I really wanted them to do it on the web. That's just my gut reaction these days. But I realized that HTML5 isn't really ready for it, so I digressed.

Or is it ready? I wasn't sure. I knew that you can do some impressive visual stuff on the web, but audio APIs are still being worked on. I also had no experience with touch-based web apps, so I didn't know how well that worked in mobile Safari.

## Building the App

After the Startup Weekend was over, I decided to try and build the musical app. The app responded to touch with visual effects around the finger and played a sound depending on where you touched it. The x-axis mapped to certain attribute (like pitch) and the y-axis mapped to something else. I can't remember exactly how it worked, but that's the idea.

It had other features like looping so that you could build up music from sounds, but it didn't align the beats correctly. I'm only going to focus on the touch aspect of it, which is most important.

The visual stuff was easy. [Canvas](http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html) is very ubiquitous these days, and it's easy to draw shapes and images with it (`drawImage(img, x, y)` for example).

Audio has issues. There are a few [different APIs](https://wiki.mozilla.org/Audio_Data_API), but the [Web Audio API](https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html) seems to finally be converging out of the chaos. There's always the simple `<audio>` element, but as everyone knows, it's extremely limited. iOS, for example, won't play multiple sounds at the same time.

We're right in the middle of adoption for the Web Audio API, unfortunately. Current versions of iOS and Safari do not support it, and neither does Firefox (it's being [worked on](https://bugzilla.mozilla.org/show_bug.cgi?id=779297)). Chrome was the first one to implement it.

Luckily, both [Safari 6](https://developer.apple.com/technologies/safari/whats-new.html) and [iOS 6](https://developer.apple.com/technologies/ios6/) are coming out with the Web Audio API! I think both of these are released in the next few weeks (as of Sept. 2012). I was able to grab a beta build of iOS 6 on my iPhone 4 and try it out!

[Here's what I came up with](http://jlongster.com/s/touch.html) ([src](https://gist.github.com/3701232)). Chrome and iOS/Safari 6 beta are the only browsers you can hear the audio in. In the specific sense, this is a good demo of the Web Audio API on iOS, and more generally it's a good demo of how the web is slowly overtaking native apps.

<iframe width="420" height="315" src="http://www.youtube.com/embed/ZRLEBu2LQe4" frameborder="0" allowfullscreen="1">iframe required</iframe>

The fullscreen app you see in the video is a webapp installed with Safari's "Add to Home Screen" functionality. It looks and feels like a native app.

[Click here to play with it](http://jlongster.com/s/touch.html), or fiddle with it right here (you will only here audio if you are in Chrome):

<iframe style="width: 100%; height: 300px" src="http://jsfiddle.net/Ns2ch/4/embedded/result,js/
" allowfullscreen="allowfullscreen" frameborder="0">needs iframe</iframe>

A quick overview of the app:

* That's an iPhone 4 in the video
* The x-axis changes pitch, and the y-axis changes volume (gain)
* There are 3 effects: Sparkler, Circle, Notes
  * Sparkler displays a trail and continuously plays a French Horn sound while dragging
  * Circle displays an explosion and plays a single sound on touch
  * Notes displays a trailing square and continuously plays a dynamically generated tone (frequency) depending on the x-axis (ranging from 100 to 2100)

One thing that's great about the web is how easy it is to develop. You just write javascript, and look at it in the browser. No compilation needed. Javascript APIs tend to be dead-simple, too. For example, this is *all* I have to do to support orientation changes in my app:

```js
window.onresize = function() {
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
};
```

This whole app is just [372 lines](https://gist.github.com/3701232) of javascript, with a little bit of HTML and CSS for the menu. It took me 2 nights of hacking to make it, probably about 8 hours total.

My expectations for iOS' support for webapps was low, but I was impressed. You can specify a loading screen, and do more than I thought.

## The Web is Close

There are so many types of mobile applications out there, and it's a huge effort to make HTML5 capable of running them. Complex UI's, audio synthesizers, intense games, etc. are all... complex. The only technological barrier you'll run into with native apps is hardware capabilities.

However, I believe the web is close. It will take a few more years for it to stabilize, but we're seeing [audio apis](https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html), [rich graphics](http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html), [custom UI components](https://dvcs.w3.org/hg/webcomponents/raw-file/tip/explainer/index.html), and a whole lot more coming to browsers soon (if not already here).

Facebook's recent ditching of the web has stirred some people to question it's future. There's two problems here: the web *is* still early on mobile, and facebook *could* have solved some of its problems on the web. I think due to the former problem, they decided to go native. For now. It doesn't mean the web can't become powerful enough.

Native apps will always have a competitive edge. Performance and raw access to APIs is really important for certain apps, like high-end games. That's not what we should focus on though. We need to ask two questions: *how fast/rich do most apps need to be* and *how much does the web need to improve to support them*. Moore's law now applies to the web: between javascript performance breakthroughs, mobile hardware improvements, and new APIs, the types of apps the mobile web can support is increasing rapidly.

There's also the issue of "write once, run anywhere" providing subpar experiences for each specific environment. I don't have room to go into detail about this, but it is an issue. I think it's mostly solvable, but this isn't the right blog post for that.

## Firefox OS

The reality is that mobile web apps aren't being pushed hard enough. It's obvious that the main focus on iOS and Android is native apps. The closed marketplaces that handle these apps is problematic for reasons I won't go into here.

Mozilla is [taking this very seriously](http://www.mozilla.org/en-US/b2g/), and has been building a mobile operating system based on Firefox's Gecko engine (it's been [on github](https://github.com/mozilla-b2g/B2G) since the beginning too!). Officially called [Firefox OS](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox_OS), it is built from the ground up with web technologies. Even the home screen is all HTML, CSS, and javascript.

![Firefox OS](/media/images/firefox-os-apps.jpg)

Two things will happen because of Firefox OS:

* New web APIs will be created because the OS needs access to hardware. Most of these APIs will be standardized and available in other browsers, if applicable.
* Web apps will officially become "native" apps and it will drive the adoption of the web into mobile

This isn't just theory. [Firefox OS will be released on a real phone](https://blog.mozilla.org/blog/2012/07/02/firefox-mobile-os/) in production in Brazil early 2013.

Mozilla is also developing an app marketplace that will be shipped along with Firefox OS. This marketplace will be open, meaning that you can get the code and host your own, and the web will support multiple marketplaces, and apps can be installed from various places.

I'm really excited about Mozilla's efforts (disclaimer: I work for Mozilla). I think it's the right direction and just what we need to claim the web's stake in the mobile world, just like Firefox did back in the 90s.

## The Reality: Native Aint Goin' Anywhere

I've been pretty positive so far, but let's be honest. Lots of companies are creating really cool native mobile apps for a thriving market. I don't see them going anywhere anytime soon.

Even if you claim that the web won the desktop, companies like Spotify are still developing native apps. I don't think it's good to look for a "winner". That's not how it works. There is a huge variety of people and technologies and developers just pick the right one they think is good for the job.

The point is that the web needs to claim its stake, else mobile will be lost to native apps completely, which forces developers to use proprietary, closed software and marketplaces to make software. The web doesn't need to be a winner, it just needs to be an option. Otherwise there will be no "open-source" choice for mobile software, and let's face it, mobile is the future.

## High Hopes

I still find it fascinating that the web has enabled an incredible amount of startups and revolutionized how we work. When I think about how it grew into the desktop scene, I see no reason why the same thing can't happen to mobile. There's lots of details that need to be figured out, of course, but if we work hard enough, I think there's a bright future for the mobile web.