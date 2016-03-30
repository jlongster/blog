---
tags: ["js","conferences"]
published: true
date: "May 29, 2013"
readnext: ""
abstract: "While at JSConf 2013 I'm taking notes for each talk and taking pictures so that I don't miss anything. Check this out if you are interested in what's going on at JSConf."
shorturl: "My-JSConf-Diary"
headerimg: "http://jlongster.com/s/post-headerimgs/postbg-jsconf.png"
---

# My JSConf 2013 Diary

I'm currently at [jsconf](http://2013.jsconf.us/) and I'm trying something new this year. Usually I only half-listen to conference talks and I don't take the time to digest them (or even write down some technical links to interesting projects).

When I'm not sitting on the each, I'm taking pictures and writing down notes for each talk. I'm not trying to summarize each talk, but I will write down any technical points that I'd like to think more about later.

* [Lessons from the experimental edge of technology - Remy Sharp](#tech-lessons)
* [JavaScript Masterclass - Angelina Fabbro](#javascript-masterclass)
* [Post Modern Game Input Devices - Luis Montes](#game-input)
* [Learning New Words - Andrew Dupont](#learning-new-words)
* [Performance Tuning Secrets - Peter Flynn](#performance-tuning)
* [Mobile HTML5: Device APIs and related APIs - Tomomi Imura](#mobile-apis)
* [AI.js: Robots with Brains! - Raquel Vèlez](#ai-robots)
* [Optimizing for Developer Happiness - Rebecca Murphey](#optimizing-happiness)
* [Facebook React](#facebook)
* [Erich Gamma](#erich-gamma)
* [Toward a language-neutral browser VM - Brendan Eich](#language-vm)
* [PLV8 - Selena Deckelmann](#plv8)
* [Perf the web forward! - John-David Dalton](#perf-web)
* [Boom, Promises/A+ Was Born - Domenic Denicola](#boom-promises)
* [Yay Yay Yay Query - YayQuery](#yayquery)
* [Making WebGL Dance - Steven Wittens](#webgl-dance)
* [CreativeJS - making art in the browser - Seb Lee-Delisle](#creativejs)

## Welcome Reception

Yes. We are on a beach. I met people.

![](http://jlongster.com/s/jsconf-2013/IMG_7203.png)

![](http://jlongster.com/s/jsconf-2013/IMG_7207.png)

And this is the morning of day #1 before the talks started. The rest of this post will be notes from each talk.

![](http://jlongster.com/s/jsconf-2013/IMG_7220.png)

<a id="tech-lessons"></a>
## Lessons from the experimental edge of technology - Remy Sharp

![](http://jlongster.com/s/jsconf-2013/IMG_7221.png)

Remy begins with an overview of the state of WebRTC and various libraries that will cover all the hard parts. Peer.js, SimpleWebRTC, and WebRTC.io are some of these libraries. He used WebRTC.io and it allowed him to get a prototype up in an hour. (I've used WebRTC.io and found it buggy though, also doesn't support Firefox.) Remy built a game with this technology that connects people to play game where throw balls at each other's heads. Don't use during fights with your wife.

One lesson is to "serve only what you need" since sending large video streams across the world will be slow (make the video smaller to constrain how much data is sent).

You can configure RTCDataChannel with a `reliable` option, which is `true` for TCP and `false` for UDP.

WebRTC is really new and there's not that much out there about it. The rest of his talk details how he implemented the graphics and other parts of his game, but I found the WebRTC part the most interesting.

<a id="javascript-masterclass"></a>
## JavaScript Masterclass - Angelina Fabbro 

"You are not special". Ouch. Natural talents don't exist as much as you think. You gotta practice programming a *lot*, and you will become an expert.

Angelina discusses how to know when you are an expert, and that you aren't alone when you feel stuck or overwhelmed. This is a less technical talk, and more of of a "howto" become an expert if you feel like you're stuck.

One of her points is to teach and/or speak at an event, but I find this frustrating because few people actually tell you how to make that happen. I've tried to speak but my talks never get accepted (and I'm pretty confident that they are interesting and I would give a good talk).

<a id="game-input"></a>
## Post Modern Game Input Devices - Luis Montes

![](http://jlongster.com/s/jsconf-2013/IMG_7229.png)

Luis shows a demo of using his phone as a controller. Used a QR code to link the phone to the site. Finally a decent use for QR codes? It's all in the browser, even the phone.

He also describes a Google Hangouts API that tracks faces, and Web Speech API for voice recognition. I'm reminded of the recent XboX One which is heavily focusing on the kinect and other forms of input for games.

He has a leap motion device! The API looks pretty straight-forward. When he hovers his hand over it, green squares appear in his browser and move with his hand. Awesome! It looks like the main part of his code is only 5 lines. 5 lines!

Oh dang, he has a Google Glass! How did get all these devices? Dang... He's showing a 3d head that moves with his face, using a library face.js that I think he wrote.

<a id="learning-new-words"></a>
## Learning New Words - Andrew Dupont

![](http://jlongster.com/s/jsconf-2013/IMG_7230.png)

"inkhorn terms" — a marker of a snobbish writer. "yeartide" and "endsay". Pulling out old words because they think English is being bastardized.

"Foresitter, Barack Obama of the Folkrike Mootband". I think this is what his title would look like in Anglish, a dialect which rejects all borrowed words.

For JavaScript, how do we want the language to evolve? We need a standards body, but on the other hand they don't specify style. New words must come from the standards body, and ES6 is the first version which declares new syntax. But it feels weird. It will run up against community-made patterns.

For example: classes. ES6 has "maximally minimal classes" which is just sugar over the exact thing we're doing right now. BUT OH NOES IT'S TURNING INTO JAVA! (personal note: I think that concern is kinda ridiculous, which mostly reflects the speaker's opinion.)

Evolution of a language: gender-neutral pronouns. The singular "they" isn't elegant but it spread because of popular use. "The doctor shouldn't harm their patient".

Basically, it's very difficult to evolve elegantly, and javascript has evolved a lot. ES6 attempts (successfully in my opinion) to clean up some of this, and borrows good concepts from other languages. There's going to be a backlash to ES6, but we should tell them "it's going to be ok". It's not going to be Java.

<a id="performance-tuning"></a>
## Performance Tuning Secrets - Peter Flynn

![](http://jlongster.com/s/jsconf-2013/IMG_7232.png)

Profiling web apps can be hard since there's so much going on. It feels like a black box sometimes.

In the Chrome timeline, you can add custom timeline markers: `console.timeStamp("event foo")`. More fine-grained: `console.time("name")` and `console.timeEnd("name")`.

Google has a testing framework called Telemetry that's built on top of the remote Chrome devtools functionality. Python scripts that can automate actions and do other profiling stuff. A project called `topcoat-server` will graph the performance results.

A special page in Chrome `chrome://tracing` gives a low-level view of what's going on by thread.

My concern with this is that it's the performance improvements will be very Chrome-specific. It's not a bad thing but it might not be the best area to invest so much time in. Apps can run smoothly in most, if not all, browsers if you invest time across all of them.

Wow, he explains how they used a high-speed camera to film a laptop to see how fast the app responds when a key is pressed (when watched in slow motion). Used this when the devtools aren't available. Very cool hack.

This should have been titled "Using Google Chrome Devtools". Goes into more details about how to use the CPU profiling in Chrome, and several other V8-specific logging techniques.

It's neat, but I was expecting to hear some insights into how to actually improve performance for large apps.

<a id="mobile-apis"></a>
## Mobile HTML5: Device APIs and related APIs - Tomomi Imura

![](http://jlongster.com/s/jsconf-2013/IMG_7234.png)

URI schemes for calling and texting: `href="tel:+14155557777"` and `href="sms:+141555?body=O%20Hai"`. I missed if this was part of a standard or not.

Geolocation and device orientation events. Orientation involves gyroscope, accelerometer, and compass. These APIs are event driven. These are implemented in most mobile browsers by now.

WebRTC allows access to the camera and microphone, but isn't quite implemented in enough browsers yet. A few other APIs were mentioned as well.

Personally I was hoping to hear a lot more about the more obscure APIs, possibly the [ones that Mozilla is working to standardize](https://wiki.mozilla.org/WebAPI).

<a id="ai-robots"></a>
## AI.js: Robots with Brains! - Raquel Vèlez

![](http://jlongster.com/s/jsconf-2013/IMG_7239.png)

First off, possibly the best title ever. Also, she just said there will be math. `#excited`

Her second robot was a driverless car. There's a picture of a truck which is full of computers in the back.

She learned a few things: robotics come from research, and people getting PhDs. but research costs a lot of money. Also they "need" OOP and threading. Learning about NodeBots and writing bots in JavaScript is much better than recompiling!

After seeing cute robots, she wrote vektor to make them more powerful and do much more interesting things. It's a linear algebra library for robotics.

**Robotics 101**: serial manipulators. Does one task in serial. (I think I got that right?) The math comes out! A series of joints are connected, each having a frame of reference. Forward kinematics takes joint angles and returns the end position. Inverse kinematics takes the end position and returns the joint angles.

More math! Rotation matrices, yay! She essentially explains the basics behind 3d space and representing position and rotation as matrices, allowing you to compose them. `vektor` does this (this is all basic linear algebra).

She shows a demo where she controls a physical arm in front of her with some browser code! She can move the joints around and it responds like an arm.

Why bother with JavaScript instead of C++? It's just getting started, but it's much easier and faster to develop with. More people can use robots, and eventually solve complex problems. C'mon, that shouldn't take much convincing.

<a id="optimizing-happiness"></a>
## Optimizing for Developer Happiness - Rebecca Murphey 

![](http://jlongster.com/s/jsconf-2013/IMG_7243.png)

BazaarVoice is a large and complex app. The problem: large and growing codebase, mission-critical app, constantly expanding team, mix of junior/senior devs, and mandate for rapid feature dev.

Developer delight involves:

* a clear path for getting people up to speed
* points of entry for junior/senior devs
* few surprises: it just works
* isolated complexity
* easy dev and debugging
* nothing more difficult than it should be

How to achieve that?

One of the simplest things you can do is add assertions in the code. That makes errors easily readable and traceable.

Another thing is good logging. Using `console.group` and `console.groupEnd`, you get a *nested* log in the console in Chrome. That's actually really awesome, almost like a humanly readable execution stack.

Third, eliminate tempation to make bad decisions. Example: a global. Don't give developers a global. Just don't. They'll do all sorts of things with it.

Fourth, automate everything. (I think I missed one point) Use tools like Grunt to codify build processes and other things.

Fifth, document everything. Every. Thing. I can get behind that. How things are pushed live, how an API works, what dependencies exist, etc. Have a CHANGELOG.

Lastly, measure progress. This is a little hard to do, but there are various ways to do this. Try to measure complexity, and it will help see how you are doing controlling it. Also, **listen**. You can see how things are progressing by what they are saying.

<a id="facebook"></a>
## Facebook React

The last two sessions were a surprise. The first one was given by two Facebook developers and they announced [Facebook React](http://facebook.github.io/react/). I didn't take many notes because I was kind of in shock of how bad of an idea I think it is. Essentially, they created a language called JSX which lets you embed XML in JavaScript to create live reactive user interfaces. XML. in JavaScript.

Ugh.

<a id="erich-gamma">
## Erich Gamma

The last one was a surprise talk by [Erich Gamma](http://en.wikipedia.org/wiki/Erich_Gamma), the guy behind TypeScript. He walked through TypeScript and showed some demos of it in action. I wanted to enjoy this talk rather than taking notes, but it was quite fun and interesting.

**That's the end of Day 1!**

## Day 2

There weren't any session on the second day, but instead tons of activities were available. I went kayaking in the morning and hung around the beach for the rest of the day. It's a great idea to have a long break in the middle of such an intense conference!

![](http://jlongster.com/s/jsconf-2013/day2.png)

## Day 3

Day 3 has begun! I'm going need a lot of coffee for this. And aloe vera.

<a id="language-vm"></a>
## Toward a language-neutral browser VM - Brendan Eich

![](http://jlongster.com/s/jsconf-2013/IMG_7249.png)

Going to show games on the web. Why AAA games? It pushes the boundaries, and is a good test. The web has gotten much better recently, compared to 10 years ago. WebGL, WebSockets, etc. 

asm.js has allowed us to try out the web as a native platform today.

Demo time! The Unreal Technology splash screen appears. He started playing Unreal Tournament the full game! It's smooth as butter.

Modern js engines have a lot of thing to make JavasScript fast, but it's hard to see if you are writing code to take advantage of it. It's speculative code. asm.js is an answer to this; a subset of JavaScript that is deterministic.

The famous benchmark graph is shown, as you would expect the numbers are very good. V8 guys want to optimize JavaScript without asm.js right now, but that's ok, that's a win as well.

It isn't for hand-coding, and needs to be generated. Awh, I'm kinda sad he didn't mention my [LLJS](http://jlongster.com/Compiling-LLJS-to-asm.js,-Now-Available-) work.

Compiling a GC to asm.js is an open issue, you don't want multiple GCs running. The JavaScript GC could have hooks to be used in the guest heap. Lua VM has been compiled to asm.js, but there's the GC issue.

JITs are another open issue. You would need to generate valid asm.js code, and we don't know if that's going to pay off or not.

Threads are also an issue. It's possible that we can share a mutable HEAP buffer and if we can validate all threads are pure asm.js code we might be able to make some optimizations (not sure if he's talking about WebWorkers).

We will have both compiled and hand-written js code, and serve two masters. Always bet on... you know what.

<a id="plv8"></a>
## PLV8 - Selena Deckelmann 

![](http://jlongster.com/s/jsconf-2013/IMG_7251.png)

My camera is pretty limited so all my pictures are going to look the same. Anyone want to buy me a wide angle/zoom lens?

I missed the first 10 minutes of this talk while talking with Eich. Lots of cool stuff around here!

PLV8 embeds v8 into postgresql. You can create js functions that you can call from SQL:

```sql
CREATE TABLE liberated AS (
 SELECT row_to_json(row) from (SELECT * FROM reports_20130506 as row)  
);
```

Unfortunately I missed the details of what this does, but I believe `row_to_json` is the js function.

Liberate the entire database! Selena wrote a function in plv8 to convert all tables to use json. She's awesome!

The json datatype is a first-class datatype.

```sql
INSERT INTO BIRDS VALUES '{ foo: 1, bar: 2 }';
```

I may have made some technical mistakes here, but you get the idea.

This is amazing. I'm gonna forget about NoSQL databases.

```sql
CREATE OR REPLACE FUNCTION inject_js(src text)
RETURNS TEXT AS $$

return eval("(function() {" + src + "})()");

$$ LANGUAGE plv8;
```

You probably don't want to do the above. But it works! She explains how Mozilla uses Postgres in crashstats, which I missed the details of.

Why use Postgres? Use "bulkbag" schema design + schema evolution: JSON to start, normalize to optimize. Easy to scale to multi-terabyte DBs. Manage your data with a language you love.

I've always felt like NoSQL threw everything out the window just to use json and a little JavaScript in your DB. I think this is an awesome step which makes many other JavaScript-based DBs somewhat pointless.
    
This is available in 9.2 with the json_enhancements extension, and built-in to 9.3 which isn't out yet (the beta has it though).

<a id="perf-web"></a>
## Perf the web forward! - John-David Dalton

![](http://jlongster.com/s/jsconf-2013/IMG_7252.png)

A few themes for performance: optimize for the common case, use native wisely, avoid abstraction, balance pros/cons.

First technique, hoist out `call` and `apply`. 

```js
while(++index < length) {
    callback.call(thisArg, array[index], index, array)
}
```

Instead:

```js
callback = createCallback(callback, thisArg);
while(++index < length) {
  callback(array[index], index, array)
}
```

`createCallback` simply creates a function that wraps around the `call` with the right `this` parameter.

\#2: Avoid binding by detetcing usage of `this` by converting the function to string and looking for `this`... with a regular expression. Seems like there would be several false positives. Oh he just said that. The worst case is that those false positives are treated with the slower path.

\#3: Reduce searches. He creates an object cache and optimizes searches that need to be done in large iterations. There's a lot of details here; just watch the video when it comes out.

Lots of cool tricks. Two of them are here:

```js
// Instead of the code in the comments, do the following

// _.flatten(array)
// concat.apply([], array)
concat.apply(Array.prototype, array)

// [foo].concat(slice.call(arguments))
var array = [foo];
push.apply(array, arguments)
```

"Sugar in moderation". If you have a chaining API, you end up iterating over your objects multiple times needlessly. A library called `lazy.js` queues up the chain and only iterates once.

<a id="boom-promises"></a>
## Boom, Promises/A+ Was Born - Domenic Denicola

![](http://jlongster.com/s/jsconf-2013/IMG_7255.png)

JavaScript community's greatest strength is that we turn tiny primitives into powerful patterns. It can also be our greatest weakness.

Async code is a problem. Continuation Passing Style is the "simplest" thing possible - just pass a function. (personal note: CPS is more than this and usually implemented in the compiler, this is talking about explicit CPS)

Explicit CPS traps you in a turing tarpit. You have to reinvent basic language features like throwing errors.

Other languages have solves this async problem with promises. It's in lots of other languages. The point of promises is simple: gives you back async versions of return and throw.

Promises can be used with JavaScript's new generators to get back to try/catch and other native language constructs.

Chai has async unit testing: `expect(promise).to.eventually.be(value)`

It all started with promises/A. It was easily misinterpreted and under-specified. After some rants and attempts to fill in some of the holes, promises/A+ came out.

DOM Futures is being worked on, which incorporates promises into DOM APIs. ES7 is even discussing integrating promises/A+ at the language level!

The contract of promises/A+ is very small. Just the `then` method.

Domenic detailed a lot about the history of what happened when promises/A+ blew up and had such a significant impact.

<a id="yayquery"></a>
# Yay Yay Yay Query - YayQuery 

![](http://jlongster.com/s/jsconf-2013/IMG_7257.png)

I really can't explain this.

<a id="webgl-dance"></a>
## Making WebGL Dance - Steven Wittens 

![](http://jlongster.com/s/jsconf-2013/IMG_7258.png)

There's going to be **4 dimensions**.

In the beginning there was pixels. Pixels are nice but jagged. We want sub-pixel accuracy. Sampling measures within the pixel if a shape is covering it and provides much more accuracy.

Nearest neigbhor fills in pixels with hard edges, bilinear filter smooths out.

His presentation is incredibly smooth and interactive. It's really hard to blog this, you just have to see it. I think you should just wait for the video.

<a id="creativejs"></a>
## CreativeJS - making art in the browser - Seb Lee-Delisle

![](http://jlongster.com/s/jsconf-2013/IMG_7261.png)

Seb is video-conferencing in to give the closing keynote. Let's hope some of us turn off our wifi... I also wonder if he's using WebRTC. I can't figure out if I should hope for that or not.

He does a lot of cool creative demos. He created a website [creativejs.com](http://creativejs.com/). He's showing a lot of his really cool work, massive interactive demos on huge screens.

Now he's live-coding a canvas demo on [jsbin](http://jsbin.com/). A line! Now recursively draw lines, and it forms a tree-shape. Oh my word, I can't imagine how hard it is to do this over video. It's hard for me present to 10 people over video.

Tweaking the angle each recursion makes the tree curve. Further tweaks makes a tree blossom out of the few lines that existed before. Now randomize the length and angles of the branches, makes it look natural. He adds a loop to continually draw the tree to animate it, but the random animation makes it just fling around.

I *love* live-coding presentations. They are my favorite.

He creates a `Branch` class to store the state of the tree, so that each loop it increases the length and angle, so it actually grows. This takes a little while but he eventually gets there!

## End

JSConf is over. All I have left is a splotchy sunburn. Well, that and a lot of excellent ideas. I have a few more pictures, too.

This is the lounge area outside of the conference room, completely with a ping-pong and foosball table, and an arcade game.

![](http://jlongster.com/s/jsconf-2013/photo1.png)

On the last day for dinner, we were taken to a river-side restaurant.

![](http://jlongster.com/s/jsconf-2013/photo2.png)

Thank you organizers for an excellent conference!





