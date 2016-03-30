---
published: true
shorturl: "Going-Fullscreen-with-Canvas"
tags: ["canvas"]
date: "November 21, 2011"
---

# Going Fullscreen with Canvas

As noted in the <a href="https://www.mozilla.org/en-US/firefox/10.0a2/auroranotes/">Release Notes</a>, Firefox Aurora introduced the <a href="https://developer.mozilla.org/en/DOM/Using_full-screen_mode">Fullscreen API</a>. This means that it will appear in the release version of Firefox in about 3 months.

This is one of several features that will be fantastic for games on the web. Other exciting APIs are the <a href="https://wiki.mozilla.org/GamepadAPI">Gamepad</a>, <a href="https://developer.mozilla.org/en/HTML/Canvas">Canvas</a>, and <a href="https://developer.mozilla.org/en/Introducing_the_Audio_API_Extension">Audio</a>. Some of these APIs still need work to be suitable for real-time games, but it's a great time to be involved in building games for the web.

I wanted to try out the Fullscreen API so I built this demo. This should work in both Firefox and Chrome. Try it out:

<link rel="stylesheet" type="text/css" href="/css/canvas-demo.css" />

<div id="screen">
  <button onclick="full()">Go Fullscreen</button>
  <div class="inner">
    <canvas id="c" width="500" height="400"> </canvas>
  </div>
</div>
<script src="http://jlongster.com/s/fullscreen-demo.js"></script>

View the source <a href="/media/js/c.js">here</a>. I found Mozilla's <a href="https://wiki.mozilla.org/Gecko:FullScreenAPI">Fullscreen API wiki page</a> to be a good overview of it all. Javascript functions/properties and CSS selectors are added to allow fullscreen access.

How to do it?
-------------

1. Grab the element you want to go fullscreen (`document.getElementById('canvas')`)
1. Call `requestFullScreen` on the element <a href="#footnote1" class="footnote">[1]</a>

That's it! Any element can easily go fullscreen. Your request for fullscreen can be denied by the user or the browser in certain conditions. For example, you can't just call for fullscreen in any javascript. It has to be initiated by the user (i.e. a button click). The full security policy for Firefox is detailed on the <a href="https://wiki.mozilla.org/Gecko:FullScreenAPI">wiki page</a>.

## More Control

So what happens when your element goes fullscreen? Firefox currently applies a `width:100%; height:100%` which stretches your element to fill up the screen. Chrome simply centers the element if it has a fixed size, otherwise it fills up the screen.

You can control this with other parts of the API. A `fullscreenchange` event is fired when the fullscreen mode changes so that you can adjust the content for fullscreen, and the document has a boolean property `fullScreen` indicating if we're in fullscreen mode <a class="footnote" href="#footnote2">[2]</a>.

There's also a new CSS pseudo-class: `:full-screen`. It selects the element that is in fullscreen mode, allowing you to apply styles to it and any of its children only in fullscreen mode. There are a few other new CSS selectors (depending on the browser) that select various parts of the document.

You can view all of this on the <a href="https://wiki.mozilla.org/Gecko:FullScreenAPI">wiki page</a> for Firefox.

I'd recommend wrapping your element in a `<div>` and fullscreening that, so that you can control how it looks in fullscreen mode consistently across browsers <a class="footnote" href="#footnote3">[3]</a>.

Here is the CSS code for the above fullscreen canvas demo (note that the canvas is wrapped in a fullscreen `<div>`):

```css
:-moz-full-screen canvas {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    margin: auto;
    width: 90%;
    height: 50%;
    box-shadow: 0px 0px 4px white;
    background-color: white;
}
```

This makes it 90% wide and 50% tall, and centers it on the screen using an absolute positioning trick.

## Fullscreening Canvas

If you change the dimensions of the canvas element with CSS in fullscreen mode, make sure to update the canvas size so that it doesn't simply stretch the rendering.

A helpful function for this is <a href="https://developer.mozilla.org/en/DOM/element.getBoundingClientRect">getBoundingClientRect</a>, which calculates the true size of an element. Here is what you should do if you fullscreen canvas:

```js
var c = document.getElementById('canvas');

function on_fullscreen_change() {
    if(document.mozFullScreen || document.webkitIsFullScreen) {
        var rect = c.getBoundingClientRect();
        c.width = rect.width;
        c.height = rect.height;
    }
    else {
        c.width = 500;
        c.height = 400;
    }
}

document.addEventListener('mozfullscreenchange', on_fullscreen_change);
document.addEventListener('webkitfullscreenchange', on_fullscreen_change);
```

## Keys

Because of security issues, Firefox and Chrome currently whitelist the available keys in fullscreen mode (<a href="https://wiki.mozilla.org/Gecko:FullScreenAPI#Proposed_Specification">more details</a>). So only the basic keys like tab, space, arrow keys, etc. work. This severely limits its usefulness for games.

According to the wiki page though, it looks like Firefox will support a `requestFullScreenWithKeys` method which will enable all keys. I'm assuming this will be available soon and will trigger a specific UI noting the potential security risk.

It seems like they could just disable the key which exits fullscreen mode though.

<div class="discuss"><a href="http://news.ycombinator.com/item?id=3261855">Discuss this on Hacker News</a></div>

<div class="footnote" id="footnote1">
     [1] The API isn't final and requires vendor prefixes
     (i.e. `requestFullScreen` is `mozRequestFullScreen`). The APIs
     are mostly the same between Firefox and Chrome.
</div>
<div class="footnote" id="footnote2">[2] The property is `isFullScreen` in webkit-based browsers.</div>
<div class="footnote" id="footnote3">[3] I tried overriding the width/height styles with `!important` in Firefox but they wouldn't stick.</div>
