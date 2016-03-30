---
abstract: "It's not clear how to use redux and react-router together on a project, but there's actually a pretty simple way to do it. Introducing redux-simple-router, a way to keep the current URL in sync in your app state and router instance."
shorturl: "A-Simple-Way-to-Route-with-Redux"
tags: ["redux","react-router"]
published: true
date: "November 25, 2015"
---

# A Simple Way to Route with Redux

This post took *months* to write. I wasn't working on it consistently, but every time I made progress something would happen that made me scratch everything. It started off as an explanation of how I integrated react-router 0.13 into my app. Now I'm going to talk about how [redux-simple-router](https://github.com/jlongster/redux-simple-router) came to be and explain the philosophy behind it.

Redux embraces a single atom app state to represent all the state for your UI. This has many benefits, the biggest of which is that pieces of state are always consistent with each other. If we update the tree immutably, it's very easy to make atomic updates to the state and keep everything consistent (as opposed to mutating individual pieces of state over time).

Conceptually, the UI is derived from this app state. Everything needed to render the UI is contained in this state, and this is powerful because you can inspect/snapshot/replay the entire UI just by targeting the app state.

But it gets awkard when you want to work with other libraries like [react-router](https://github.com/rackt/react-router) that want to take part in state management. react-router is a powerful library for component-based routing; it inherently manages the routing state to provide the user with powerful APIs that handle everything gracefully.

So what do we do? We could use react-router and redux side-by-side, but then the app state object does not contain everything needed for the UI. Snapshotting, replaying, and all that is broken.

One option is to try to take control over all the router state and proxy everything back to react-router. This is what [redux-router](https://github.com/rackt/redux-router) attempts to do, but it's very complicated and prone to bugs. react-router may put unserializable state in the tree, thus still breaking snapshotting and other useful features.

After integrating redux and react-router in my site, I extracted my solution to a new project: [redux-simple-router](https://github.com/jlongster/redux-simple-router). The goal is simple: **let react-router do all the work**. They have already developed very elegant APIs for implementing routing components, and you should just use them.

If you use the regular react-router APIs, how does it work? How does the app state object know anything about routing? Simple: we already have a serialized form of all the react-router state: the URL. All we have to do is store the URL in the app state and keep it in sync with react-router, and the app state has everything it needs to render the UI.

People think that the app state object has to have *everything*, but it doesn't. It just has to have the primary state; anything that can be deduced can live outside of redux.

![](http://jlongster.com/s/upload/redux-state-external.png)

Above, the blue thing is serializable dumb app state, and the green things are unserializable programs that exist in memory. As long as you can recreate the green things above when loading up an app state, you're fine. And you can easily do this with react-router by just initializing it with the URL from the app state.

Since launching it, [a bunch of people](https://github.com/jlongster/redux-simple-router/graphs/contributors) have already helped improve it in many ways, and a lot of people seem to be finding it useful. Thank you for providing feedback and contributing patches!

## Just use react-router

The brilliant thing about just tracking the URL is that it takes almost no code at all. redux-simple-router is only [87 lines of code](https://github.com/jlongster/redux-simple-router/blob/master/src/index.js) and it's easy to understand what's going on. You already have a lot of concepts to juggle (react, redux, react-router, etc); you shouldn't have to learn another large abstraction.

Everything you want to do can be done with react-router directly. A lot of people coming from redux-router seem to surprised about this. Some people don't understand the following:

* Routing components have all the information you need as properties. See [the docs](https://github.com/rackt/react-router/blob/master/docs/API.md#route-components); the current location, params, and more are all there for you to use.
* You can block route transitions with [`listenBefore`](https://github.com/rackt/history/blob/master/docs/ConfirmingNavigation.md#confirming-navigation).
* You can inject code to run when a routing component is created with [`createElement`](https://github.com/rackt/react-router/blob/master/docs/API.md#createelementcomponent-props), if you want to do stuff like automatically start loading data.

We should invest in the react-router community and figure out the right patterns for everybody using it, not just people using redux. We also get to use new react-router features immediately.

The *only* additional thing redux-simple-router provides is a way to change the URL with the [`updatePath`](https://github.com/jlongster/redux-simple-router#updatepathpath-norouterupdate) action creator. The reason is that it's a very common use case to update the URL inside of an action creator; you might want to redirect the user to another page depending on the result of an async request, for example. You don't have access to the `history` object there.

You shouldn't really even be selecting the `path` state from the redux-simple-router state; try to only make top-level routing components actually depend on the URL.

## So how does it work?

You can skip this section if you aren't interested in the nitty-gritty details. We use a pretty clever hack to simplify the syncing though, so I wanted to write about it!

You call `syncReduxAndRouter` with history and store objects and it will keep them in sync. It does this by listening to history changes with `history.listen` and state changes with `store.subscribe` and telling each other when something changes.

![](http://jlongster.com/s/upload/redux-router-sync.png)

It's a little tricky because each listener needs to know when to "stop." If the app state changes, it needs to call `history.pushState`, but the history listener should see that it's up-to-date and not do anything. When it's the other way around, the history listener needs to call `store.dispatch` to update the path but the store listener should see that nothing has changed.

First, let's talk about `history`. How can we tell if anything has changed? We get the new `location` object so we just [stringify it](https://github.com/jlongster/redux-simple-router/blob/bd332dc19a5d8674e42de670c0769f77f2ffc7b5/src/index.js#L38-L40) into a URL and then [compare it](https://github.com/jlongster/redux-simple-router/blob/bd332dc19a5d8674e42de670c0769f77f2ffc7b5/src/index.js#L57) with the URL in the app state. If it's the same, we do nothing. Pretty easy!

Detecting app state changes is a little harder. In previous versions, we were comparing the URL from state with the current location's URL. But this caused tons of problems. For example, if the user has installed a `listenBefore` hook, it will be invoked from the `pushState` call in the store subscriber (because the app state URL is different from the current URL). The user might dispatch actions in `listenBefore` and update other state though, and since we are subscribed to the whole store, our listener will run again. At this point the URL has *not* been updated yet so we will call `pushState` *again*, and the `listenBefore` hook will be called again, causing an infinite loop.

Even if we could somehow only trigger `pushState` calls when the URL app state changes, this is not semantically correct. Every single time the user tries to change the URL, we should *always* call `pushState` even if the URL is the same as the current one. This is how browsers work; think of clicking on a link to "/foo" even though "/foo" is the current URL: what happens?

In redux, reducers are pure so we cannot call `pushState` there. We could do it in a middleware (which is what redux-router does) but I really don't want to force people to install a middleware just for this. We could do it in the action creator, but that seems like the wrong time: reducers may respond to the [`UPDATE_PATH`](https://github.com/jlongster/redux-simple-router#update_path) action and update some state, so we shouldn't rerender routing components until after reducing.

I came up with a clever hack: just use an `id` in the routing state and [increment it](https://github.com/jlongster/redux-simple-router/blob/master/src/index.js#L30) whenever we want to trigger a `pushState`! This has drastically simplified everything, made it far more robust, and even better made [testing really easy](https://github.com/jlongster/redux-simple-router/blob/master/test/index.js#L87) because we can just check that the `changeId` field is the right number.

We just have to keep track of the last `changeId` we've seen an compare it in the store subscriber. This means there's always a 1:1 relationship with `updatePath` action creator calls and `pushState` calls no matter what. Try any transition logic you want, it should work!

It also simplifies how changes from the router to redux work, because [it calls](https://github.com/jlongster/redux-simple-router/blob/master/src/index.js#L58) the `updatePath` action creator with an `avoidRouterUpdate` flag and all we have to do in the reducer it just *not* increment `changeId` and we won't call back into the router.

I think my favorite side effect of this technique is testing. [Look at the tests](https://github.com/jlongster/redux-simple-router/blob/master/test/index.js#L77) and you'll see I can compare a bunch of `changeIds` to make sure that the right number of `pushState` calls are being made.

## More Complex Examples of react-router

Originally I was going to walk through how I used react-router for complex use cases like server-side rendering. This post is already too long to go into details, and I don't have time to write another post, so I will leave you with a few points that will help you dig into the code to see how it works:

* There's no problem making a component both a redux "connected" component *and* a route component. [Here](https://github.com/jlongster/blog/blob/f986d022d0ce93ada2e4994fc1e160f782ff213a/src/components/drafts.js#L39) I'm exporting a connected `Drafts` page will be installed in the router. That means the component can both select from state as well as be controlled by the router.
* I perform data fetching by specifying a [static `populateStore` function](https://github.com/jlongster/blog/blob/f986d022d0ce93ada2e4994fc1e160f782ff213a/src/components/index.js#L21). On the client, the router will call this in `createElement` [seen here](https://github.com/jlongster/blog/blob/master/src/routes.js#L30) , and the backend can prepopulate the store by [iterating over all route components](https://github.com/jlongster/blog/blob/f986d022d0ce93ada2e4994fc1e160f782ff213a/server/app.js#L205-L213) and calling this method. The action creators are responsible for checking if the data is already loaded and not re-fetching on the frontend of it's already there ([example](https://github.com/jlongster/blog/blob/f986d022d0ce93ada2e4994fc1e160f782ff213a/src/actions/posts.js#L33)).
* The server uses the lower-level `match` API [seen here](https://github.com/jlongster/blog/blob/8342b40bb2ed6bcbeedff29b9f7ef0b5ee06eb03/server/app.js#L216) to get the current route. This gives us flexibility to control everything. We store the current HTML status in redux ([like a 500](https://github.com/jlongster/blog/blob/8342b40bb2ed6bcbeedff29b9f7ef0b5ee06eb03/server/app.js#L287)) so that components can change it. For example, the `Post` component can set a [404 code](https://github.com/jlongster/blog/blob/8342b40bb2ed6bcbeedff29b9f7ef0b5ee06eb03/src/components/post.js#L114) if the post isn't found. The server [sends the page](https://github.com/jlongster/blog/blob/8342b40bb2ed6bcbeedff29b9f7ef0b5ee06eb03/server/app.js#L298) with the right HTML status code.
* This also means the top-level `App` component can [inspect the status code](https://github.com/jlongster/blog/blob/8342b40bb2ed6bcbeedff29b9f7ef0b5ee06eb03/src/components/app.js#L46-L51) to see if it should display a special 404 or 500 page.

I really like how the react-router 1.0 API turned out. The idea seems to be use low-level APIs on the server so that you can control everything, but the client can simply render a `Router` component to automatically handle state. The two environments are different enough that this works great.

# That's It

It's my goal to research ideas and present them in a way to help other people. In this case a cool project, [redux-simple-router](https://github.com/jlongster/redux-simple-router), came out of it. I hope this post explains the reasons behind and the above links help show more complicated examples of using it.

We are working on porting [react-redux-universal-hot-example](https://github.com/erikras/react-redux-universal-hot-example) to redux-simple-router, so that will be another example of all kinds of uses. We're really close to finishing it, and you can follow along in [this issue](https://github.com/jlongster/redux-simple-router/issues/13).

I'm also going to add more examples in the repo itself. But the goal is that you should be able to just read [react-router](https://github.com/rackt/react-router)'s docs and do whatever it tells you to do.

Lastly, the folks working on [redux-router](https://github.com/rackt/redux-router) have put in a lot of good work and I don't mean to diminish that. I think it's healthy for multiple approaches to exist and everyone can learn something from each one.


