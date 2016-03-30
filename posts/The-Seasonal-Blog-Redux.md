---
shorturl: "The-Seasonal-Blog-Redux"
headerimg: "http://jlongster.com/s/upload/blacksmith.png"
tags: ["blog","redux"]
published: true
date: "September 17, 2015"
abstract: "It's that time of year again! The weeds are growing, the air is thick and stagnant, and I just deployed another refactoring of my blog. \"Why does he keep working on his blog,\" you're thinking, \"when I could do all of that with a static-site generator like Jekyll?\""
---

# The Seasonal Blog Redux

It's that time of year again! The weeds are growing, the air is thick and stagnant, and I just deployed another refactoring of my blog. "Why does he keep working on his blog," you're thinking, "when I could do all of that with a static-site generator like Jekyll?"

Writing my own blogging engine has been one of the best decisions I've made. Having a side project that I actually use and get value from is a great place to implement my own ideas, or try out new libraries. Every now and then it's fun to throw it back in the furnance, get it hot, and start shaping it with new ideas.

A blog is a great litmus test for new libraries (remember, I have an admin site behind this). You have to deal with routing, forms, interfacing with things like the CodeMirror editor, server-side rendering, async data fetching, and more. I feel like it really hits most of the pain-points of big client-side apps, even if it's a relatively small project. The only thing it doesn't stress is a complex shape of data: the data I get back from the server is pretty simple, and and more complex apps would need something better to handle complex data.

But even then, contrasting my simple code with more complex solutions makes it really clear *why* they are solved that way. Take [GraphQL](http://facebook.github.io/react/blog/2015/05/01/graphql-introduction.html) for example; I definitely don't need it, but there are a few places in my code that would *obviously* be way more complex if my data was more complex, and it's clear what GraphQL is trying to solve.

[Last time](http://jlongster.com/Presenting-The-Most-Over-Engineered-Blog-Ever) I completely rewrote my blog, I learned about [react-router](https://github.com/rackt/react-router), [Webpack](http://webpack.github.io/docs/) (with babel integration), server-side rendering (universal apps), [Docker](https://www.docker.com/), and various aspects of [React](http://facebook.github.io/react/).

This time, I learned about [Redux](https://github.com/rackt/redux), [immutable-js](https://github.com/facebook/immutable-js), and having a fully snapshot-able app state.

What do I mean by **snapshot**? My entire app state (even component local state) lives as a nested tree with a single root. I can simply serialize that root, and load it in later to see the app exactly how it was a that point in time. Here's a fun trick to show you what I mean: copy [all of this text](https://gist.githubusercontent.com/jlongster/55b1f54f0a29ea235dc3/raw/8643c538e836a96eaa9e7b0c5e05d998d0363268/gistfile1.txt), press cmd+shift+k and paste it in. That's my admin interface with 2 errors; you're seeing it exactly at that point (may not work in all browsers, Chrome is known to truncate prompt inputs. I'll make my own modal at some point).

![](http://jlongster.com/s/upload/redux-admin.gif)

## Redux What?

[Redux](https://github.com/rackt/redux) is library that complements React and manages application state. It provides a simple workflow for updating application state and allowing React components to subscribe to state changes. While it borrows ideas from Elm, Flux, and various fancy-sounding abstractions, it's actually quite simple.

It embraces an idea currently bubbling up in the UI community: make state *explicit and immutable*, use *pure functions* as much as possible, and push all side effects to the edge of your app. In fact, the entire state exists as a single atom: a deeply nested JS object that contains everything you need to render the current UI.

This seems radical, but it's the right way to do things.

1. Your frontend is made up of simple pure functions that take inputs and return outputs. This makes it extremely easy to test, rationalize about, and do things like hot-reloading. Separating state from code just makes things simpler.

2. Your state exists as a single object that is never mutated. Normally it's a JS object, but it could be an [immutable.js](https://github.com/facebook/immutable-js) object or even a [client-side database](https://github.com/tonsky/datascript). Thats right, putting state in one place means you could even use a database for state. That's not even the best part: with a single atom and immutability, you can easily snapshot and resume the app at any point in time!

Redux provides the ability for the UI to subscribe to changes to specific parts of the app state. Generally only top-level components in the UI select state from the global app state atom, and most components are pure: they simply receive data and render it.

The library has roots in [flux](https://github.com/facebook/flux/), Facebooks original library for handling state. The main similarity is you dispatch *actions* to change state. An action is simply a JavaScript object with a `type` field and any other fields as arguments. These actions are dispatched across all registered "reducers", which are functions that take state and an action and return new state: `(state, action) -> newState`. All new states are grouped together into a new single atom app state.

The real-world is grey and misty like a London street. You can't use pure functions and a global app state atom for everything. Asynchronous code is inherently side-effecting, but by isolating it to a specific part of your app, the rest of the world doesn't have to be bothered with things such as promises or observables. Updating the app state and rendering the UI is completely synchronous, but "async action creators" are functions which have the ability to dispatch multiple actions over time.

Local state is obviously desirable in certain situations, although it's less important than you think. UIs tend to require global state: many different parts of the UI need access to the same data. However, local state is important mainly for performance reasons. We are not out of luck though: we can get local state back by scoping part of the global app state atom to single components, as [CircleCI did](http://blog.circleci.com/local-state-global-concerns/).

The frontend space is super interesting these days, and there's a lot to talk about. [Follow me](http://jlongster.com/atom.xml) as I blog more about what I learned rewriting my blog with these ideas. I'll walk through specific techniques in my blog's code dealing with:

* [Using immutable.js for app state](http://jlongster.com/Using-Immutable-Data-Structures-in-JavaScript)
* [Integrating Redux with react-router](http://jlongster.com/A-Simple-Way-to-Route-with-Redux)
* Data fetching and asynchronous action creators (explained in [more complex examples](http://jlongster.com/A-Simple-Way-to-Route-with-Redux#More-Complex-Example) section of the router article)
* Server-side rendering (also explained in [more complex examples](http://jlongster.com/A-Simple-Way-to-Route-with-Redux#More-Complex-Example))
* Local state (the way I deal with local component state is neat, but a big hack. I don't plan on writing a whole post yet, but you can [read the source](https://github.com/jlongster/blog/blob/8342b40bb2ed6bcbeedff29b9f7ef0b5ee06eb03/src/lib/local-state.js))

Feel free to peruse [my blog's code](https://github.com/jlongster/blog) in the meantime. (Update: I've now linked to various articles that go into more details.)
