---
shorturl: "Why-React-Native-is-Different"
assets: "/s/fullscreen.js"
tags: ["react"]
published: true
date: "May 6, 2015"
abstract: "I gave a talk at a local JavaScript meetup in Richmond, VA about React Native. Here are my slides and a recording of the talk. Check this out if you want to see why React Native is so cool!"
---

# Why React Native is Different

<p class="expl">
I gave this talk at a local <a href="http://rvajs.com/">JavaScript meetup</a> in Richmond, VA on May 5th and recorded it using screencasting software. The sound quality is poor, but it's still very watchable. Check this out if you want a good explanation for why React Native will change how you write native mobile apps, and how the web can learn from it. To the women readers/watchers: I apologize for saying "guys" in a few places referring to groups of people ("Facebook guys"), it's a habit I'm still trying to break.
</p>

<p class="expl">
This post is actually my slides as well, so you can scroll through all of them below if you don't want to watch the video.
</p>

<iframe width="640" height="360" src="https://www.youtube.com/embed/ZM2NAD__iK4" frameborder="0" allowfullscreen></iframe>

<hr>

# Why *React* is Different

<hr>

## React is a Library for Building User Interfaces

<hr>

![](http://jlongster.com/s/upload/dfsdfsdgsddsf.png)

<hr>

![](http://jlongster.com/s/upload/9401_nature_grass2.jpg)

<hr>

## Separation of Concerns = MVC

<hr>

## ... Really?

<hr>

![](http://jlongster.com/s/upload/rn-1aa.png)

<hr>

![](http://jlongster.com/s/upload/rn-2.png)

<hr>

![](http://jlongster.com/s/upload/rn-3a.png)

<hr>

# Components

<hr>

![](http://jlongster.com/s/upload/rn-4.png)

<hr>

![](http://jlongster.com/s/upload/rn-5.png)

<hr>

![](http://jlongster.com/s/upload/rn-6.png)

<hr>

# `state.post.title = "...";`
# Change the UI??

<hr>

* `Object.observe(state.post)`
* `state.post.author.name = "James";`
* `UH OH`

<hr>

# `render :: state -> UI`

<hr>

![](http://jlongster.com/s/upload/rn-7.png)

<hr>

![](http://jlongster.com/s/upload/rn-8.png)

<hr>

## DOM (and Virtual DOM) is an implementation detail

<hr>

![](http://jlongster.com/s/upload/bmnkukgjkjjh.png)

<hr>

# Getting Started

* `$ npm install -g react-native-cli`
* `$ react-native init my-project`

<hr>

* `$ mkdir react-native-cli`
* `$ cd react-native-cli`
* `$ npm install react-native`
* Creates basic Xcode iOS project that builds and links with React Native's code

<hr>

* View
* Text
* ListView
* ScrollView
* TextInput
* NavigatorIOS
* (many others)

<hr>

# Flexbox

<hr>

# HTML APIs: `fetch`

<hr>

# StyleSheet.create({})

<hr>

# Incredible Debugging

<hr>

# The iOS<->JS Bridge and 60 FPS Interfaces

<hr>

```js
// CalendarManager.m
@implementation CalendarManager

RCT_EXPORT_MODULE();

@end
```

<hr>


```js
RCT_EXPORT_METHOD(addEvent:(NSString *)name
                  location:(NSString *)location)
{
  RCTLogInfo(@"Pretending to create an event");
}
```

<hr>


```js
var CalendarManager =
  require('NativeModules').CalendarManager;
  
CalendarManager.addEvent(
  'Birthday Party',
  '4 Privet Drive, Surrey'
);
```

<hr>

# A Better Web?

<hr>

# May the Cinco Be With You

<hr>

<style>header, footer, .additional-footer { color: #f0f0f0; background-color: #333333; border: 0 } h1, h2 { color: #ffaaff; line-height: 1em; } h1 { font-size: 6vw; } h2 { font-size: 5vw } article .date { margin-bottom: 2em; } article > div h1:nth-of-type(2n+1) { color: #aaffff; } article > h1 { margin-top: 15vh; } .post-page { background-color: #333333; } .post .date { font-size: 3vw; line-height: 1.5em; } .main-wrapper { width:100%; text-align: center; margin: 0} main { padding: 1px 1em; } main, a, a:active { color: #f0f0f0; } article ul { list-style: none; font-size: 4vw; margin-left: 1em; text-align: left } article ul li { margin-top: 1em; line-height: 1em } hr { border: 0; height: 50vh } :-moz-full-screen { overflow: scroll } :-webkit-full-screen { overflow: scroll } pre code.hljs { text-align: left; font-size: 3vw; } .post-page article .expl { width: 700px; margin-left: auto; margin-right: auto; text-align: left; } article .tags { display: none }
</style>