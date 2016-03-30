---
abstract: "Last week I gave a talk at ReactiveConf about how React and Redux solve a lot of issues in complex apps. I talked about how vital it is to keep things as simple as possible, and how we're trying to clean up the code of Firefox Developer Tools. Watch it here."
shorturl: "My-ReactiveConf-Talk"
tags: ["talks"]
published: true
date: "November 10, 2015"
---

# My ReactiveConf Talk

Last week I gave a talk at [ReactiveConf](https://reactive2015.com/) about how React and Redux solve a lot of issues in complex apps. I talked about how vital it is to keep things as simple as possible, and how we're trying to clean up the code of Firefox Developer Tools.

I thought it would be good to post it here and give a little retrospective on it. Watch it here:

<iframe width="560" height="315" src="https://www.youtube.com/embed/BfzjuhX4wJ0?start=728" frameborder="0" allowfullscreen></iframe>

I gave a similar talk at Strange Loop which can be watched [here](https://www.youtube.com/watch?v=qUlRpybs7_c). It's similar content, but I restructured the whole talk the second time around. I went into more details at Strange Loop.

A few notes now that my trip is over:

* Even though I was trying to be very conscious of it, man, I still said "um" a lot. It's crazy how hard it is to speak elegantly if it doesn't come naturally.
* I always find 30 minutes to be a very hard time slot. I prefer 45 min by far. I would have spent the last 15 minutes talking about migrating code again and going into more detail about how we're actually cleaning up code in the Firefox devtools. I feel like I wasn't able to wrap it up.
* To give some more details about how Firefox devtools is using all of this, the new memory tool is fully written in React and Redux, and I'm cleaning up the debugger to use Redux. I am very, very close in landing that work. I have only cleaned up the core of the debugger, but that's the hardest part. Interestingly, I am not even using React yet. Watch my Strange Loop talk to see how I'm using Redux without React.
* I think the synchronous nature of React/Redux is one of the most under-hyped selling points. The fact that changing state and updating the UI always is synchronous and happens on the same tick makes thing very easy to grasp what's going on for me. It's a big relief, especially coming from our current code where there are promises everywhere.
* I has some good discussions about Elm, Cycle.js, and observables, where async UIs are more common (I don't know much about Elm, Cycle.js definitely embraces it though). [Paul Taylor](https://twitter.com/trxcllnt) (one of the creators of Falcor) especially helped me understand how observables work (watch [his talk](https://www.youtube.com/watch?v=BfzjuhX4wJ0&feature=youtu.be&t=7h3m53s), as well as André's [Cycle.js talk](https://www.youtube.com/watch?v=9cIEtC-V2XE)). It's powerful stuff, but I still can't get behind making state implicit. With observables, state is implicitly held in the data flow that you build with streams, whereas with Redux you store state explicitly (like "is loading", etc) in a store. Implicit state makes some things hard like server rendering (Elm doesn't even support that).

It was a great conference, even if my baggage got lost and I sat beside an angry old man for 10 hours on the flight who kept shaking me awake.



