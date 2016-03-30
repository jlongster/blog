---
tags: ["ui","react"]
published: true
date: "May 13, 2014"
readnext: "Writing-Your-First-Sweet.js-Macro"
abstract: "I've been studying frameworks and libraries like Ember, Angular, and React the past several months, and given Web Components a lot of thought. I found React to be the most enlightening, and I'll explain why."
shorturl: "Removing-User-Interface-Complexity,-or-Why-React-is-Awesome"
headerimg: ""
---

# Removing User Interface Complexity, or Why React is Awesome

I've been studying frameworks and libraries like Ember, Angular, and React the past several months, and given Web Components a lot of thought. These all solve similar problems to varying degrees, and are in conflict in some ways and in harmony in others.

I'm mostly concerned with the core problems of data binding and componentizing UIs. After much research and usage of the technologies mentioned above, I found [React](http://facebook.github.io/react/) to provide the best solution.

I ask that you set aside your framework prejudices and read this post with an open mind. This post is not to evangelize React specifically, but to explain why its technique is profound. I want developers steeped in other technologies to take a hard look at these techniques, particularly those involved in Web Components.

This post actually started as a call to address problems with Web Components. But I've come to realize a few things: the bottom half of the Web Components effort (unlocking all the builtin stuff so that even native tags could be rewritten) is a great thing, Web Components are a step up from current technology regardless, and I don't want to do harm to that effort. My concerns are quite vague as well, so it doesn't make a good blog post. I can't reconcile what I want components to be with Web Components, and it's much better if I fully explain what I think is the best solution and leave it up to the readers to apply if they choose.

<a id="breakpoint-initial"></a>

## The Bloop Library

I'm not going to focus on React specifically. In fact, just in case it would be distracting, we're not going to use React at all.

We're going to build our own library from scratch that is highly inspired by React. This lets us play with all kinds of ideas with a very small amount of code. This is prototype-quality, of course, and wouldn't scale to large UIs, but using something like React would make it scale.

Let's call our library **Bloop**. Our library should let us change data and transparently keep the UI in sync. It should allow us to structure the UI into components, and flow data between them sanely.

First, we need a way to represent behavior and structure. It's easy to write behaviors as JavaScript, but what about the structure? We could use a templating language that looks like HTML, but it's much easier just to represent it in JavaScript too. It keeps the component together, makes it trivial to wire up the structure with behaviors, and allows us to easily share the component. Just imagine being able to use JavaScript for importing a component:

```js
var MyToolbar = require('shared-components/toolbar');
```

You can't even do something as basic as that with Web Components.

This is what a component looks like with our library. It shows a number and a button that, when pressed, increments the number. `getInitialState` returns the initial state of the object that can be accessed with `this.state`.

<a id="breakpoint-app1"></a>

```js
var Box = Bloop.createClass({
  getInitialState: function() {
    return { number: 0 };
  },
  
  updateNumber: function() {
    this.state.number++;
  },
  
  render: function() {
    return dom.div(
      this.state.number,
      dom.button({ onClick: this.updateNumber }, 'Increment')
    );
  }
});
```

Next, we need a way to render it into the page. You can use `renderComponent` to render a component instance into a DOM element.

```js
Bloop.renderComponent(Box(), document.body);
```

There's a problem with this though: it doesn't rerender whenever the state changes. The `Box` component mutates its state directly, so we don't know when something has changed. We could add a `set` method that tells us what is changing, but then we need to figure out which pieces of the DOM to update, which gets really complicated. Here's an idea: rerender the entire app whenever a change is made. That way, it's really easy to keep everything in sync.

But how do we know when a change is made? A `set` method to change state could trigger a rerender, but there's an even easier way to react to changes: continuously call `renderComponent` with `requestAnimationFrame` to repaint the UI, and only change the DOM when the component returns different content. **React does not do this** by default; it has a `setState` method to change state that triggeres a repaint. Let's just have some fun with `requestAnimationFrame`, even though you would never do this in production. View the full source code for this example [here](https://gist.github.com/jlongster/3f32b2c7dce588f24c92#file-a-increment-js).

```js
var box = Box();

function render() {
  Bloop.renderComponent(box, document.body);
  requestAnimationFrame(render);
}

render();
```

Rerendering everything (and only applying it to the DOM when something actually changed) vastly simplifies the architecture of our app. Observables+DOM elements is a leaky abstraction, and as a user I shouldn't need an intimate knowledge of how the UI is kept in sync with my data. This architecture opens up lots of various ways to optimize the rendering, but it's all completely transparent to the user.

The Bloop library is only [250 lines of JavaScript](https://gist.github.com/jlongster/11192270), and simply renders a component by setting `innerHTML` if changed. Since you usually have a top-level `App` component, that means the entire app is rendered with `innerHTML`. I told you it was prototype-quality, right? In a twisted, absurd way, it's shocking how far you can go with this. And the kicker is you can easily swap this out with React to get much better rendering performance, since React has a virtual DOM and will only touch the real DOM when needed. That also solves various problems like rerendering forms and other controls which have focus.

Since everything is rerendered on update, we've decoupled data binding and views and libraries can reuse it in many different ways like [Om](https://github.com/swannodette/om). Even though React implements complicated optimizations, the mental footprint is as small as our Bloop library which is a breathe of fresh air amid other complicated data binding technologies.

## Data Flow

<a id="breakpoint-data-flow1"></a>

We expressed our component's structure in JavaScript instead of trying to mangle it into the DOM. This makes data flow very natural, since we have direct access to the component instance. If you use the DOM directly, it's common to have to wire up the data flow in JavaScript afterwards. A templating engine with automatic bindings helps, but it still creates more complexity than necessary. The days of having one big HTML file are gone; components and their behaviors are intimately dependant and should be encapsulated like so.

Aren't you tired of having to query the DOM tree and manually manage the structure to create UIs? Web Components doesn't solve this at all, it just tries to encapsulate the work. **The problem is that building apps *is* building components, so you inevitably are forced back into the manual DOM management to create your app-specific components** (like how you constantly have to create directives in Angular). You also need to jump into JavaScript to configure and wire up any Web Components you used. It's a very messy abstraction, and fools you into desiring a [pure HTML-based declarative way](http://www.polymer-project.org/) to write apps, which is like wanting steak but eating liver.

Frameworks like Ember and Angular help a lot with this. However, templates and controllers are still separated and data binding still leaks into your app (especially in Angular, `$scope.$apply` is the devil). Ember does a better job than most, but you still have to declare data dependencies manually (computed properties) and ultimately accept its way of modelling data. That's not a bad thing but there are things you can't do that we will study later in this article. It simply comes down to the framework vs. library debate.

<a id="breakpoint-data-flow2"></a>

In Bloop, there's a clear and simple flow of data: data is passed down and events flow up. Here is the same example as before, but with multiple components to demonstrate data flow. In all of my examples, you can assume `dom` is set to `Bloop.dom` and that the `App` component is continuously rendered with `requestAnimationFrame` like you saw in the first section.

There are two components: `Toolbar` which makes a few buttons that change the number, and `App` which is our top-level component that uses `Toolbar`. `App` has state: the current value of the number. It passes this state into `Toolbar`, so that toolbar can decrement and increment the number. But `Toolbar` never touches our app state; it can make a new number, and call the `onChange` handler with the new number, but it can't do anything else. It's up to the `App` component to bind the `onChange` handler to one of its methods which takes the new number and actually modifies the state.

This introduces another aspect of Bloop: properties. Properties are available as `this.props` and represent the data passed into the component. Components should never mutate their properties. View the full source for this example [here](https://gist.github.com/jlongster/3f32b2c7dce588f24c92#file-b-increment-decrement-js).

```js
var App = Bloop.createClass({
  getInitialState: function() {
    return { number: 0 };
  },

  updateNumber: function(value) {
    this.state.number = value;
  },
  
  render: function() {
    return dom.div(
      dom.span(this.state.number),
      Toolbar({
        number: this.state.number,
        onChange: this.updateNumber
      })
    );
  }
});

var Toolbar = Bloop.createClass({
  render: function() {
    return dom.div(
      dom.button({
        onClick: this.props.onChange.bind(null, this.props.number - 1)
      }, 'decrement'),
      dom.button({
        onClick: this.props.onChange.bind(null, this.props.number + 1)
      }, 'increment')
    );
  }
});
```

State flows down the components, and events flow up. Note that while properties should never be changed, state is mutable. Properties can't be changed because they are inherited every time the component is rendered, so any changes will be lost.

The difference between state and properties can be useful. It makes it clear what state the component owns. It's best to keep most of your components stateless, and isolate state into as few places as possible. This makes it easy to rationalize about your app and how it changes over time. We will explore this more in the next section.

This example is trivial and so far we've been pretty abstract. You will see more complex examples throughout this post. Communication between components is difficult to do right, and Bloop and React provide you with this simple data flow for handling it, even if it may be limiting in certain cases (you many find yourself adding a lot of trivial methods to `App` to change app state). Check out [this](http://facebook.github.io/react/tips/communicate-between-components.html) and [this](http://facebook.github.io/react/tips/expose-component-functions.html) page from React about it. Near the end of article, we will explore modifications to this approach.

<a id="breakpoint-data-flow3"></a>

Let's quickly look at a more complex example. This app has tabs that switch between content, and a settings pane that lets you customize it. [View the code here](https://gist.github.com/jlongster/3f32b2c7dce588f24c92#file-c-tabbed-app-js). There is a [Tabs](https://gist.github.com/jlongster/3f32b2c7dce588f24c92#file-c-tabbed-app-js-L65) component that responds to tab changes by calling the `onChange` handler, and we [bind that](https://gist.github.com/jlongster/3f32b2c7dce588f24c92#file-c-tabbed-app-js-L59) to the `changeTab` method on our top-level `App` component.

Additionally, there is a [`Settings`](https://gist.github.com/jlongster/3f32b2c7dce588f24c92#file-c-tabbed-app-js-L87) component that renders the settings form. Whenever a setting changes, all it does is call its `onChange` property, which [we bound](https://gist.github.com/jlongster/3f32b2c7dce588f24c92#file-c-tabbed-app-js-L45) to the `changeSetting` method on `App`.

Fundamentally, this is a declarative way to construct components. The `render` method continuously constructs a new UI based on simple JavaScript objects, binding specific events to component methods.

## Explicit App State

You're probably already familiar with the pattern of attaching event handlers to components. As described above, Bloop takes this even further though, making it clear that events flow upward, and since everything is in JavaScript it's dead simple to take a JavaScript function and bind it right onto the component. You do this declaratively within `render` when creating the component.

There's a deeper reason why it's so important to make data flow clear and simple: it encourages you to keep state in as few places as possible and make most of your components stateless. It's easy to create complex data flows in Bloop with many small components, and keep track of what's going on. Additionally, instead of setting state directly on a component instance, Bloop makes it explicitly a separate JavaScript object. Components that do have state can access it with `this.state`. A component that uses state must implement a `getInitialState` method that returns the initial state object.

Tearing apart state from the component instance turns out to be really powerful. It fits well with the model that most of our state is held at the top-level, since most of your UI is now described in one simple JavaScript object. This has far-reaching consequences.

1. **It's adaptable.** The state object doesn't have to be a native JavaScript object; it can be anything you return in `getInitialState` (or your own way of passing state around, if you choose). Want to use [persistent data structures](https://github.com/swannodette/mori) instead? Go ahead!
2. **It's easy to snapshot.** Given a specific state, you can guarantee what the resulting HTML of a component will be. If you simply save the state object somewhere, you can load it up later and render your component exactly like it was when you saved it. An undo system is trivial: just save the state, and restore it (which is especially trivial with persistent data structures).
3. **It's easy to test and prerender.** Similar to point #2, you can easily test components by rendering them with a specific state to an HTML string and comparing the output. You can even manually fire off event handlers which change state and test the changes. Finally, prerendering on the server is as trivial as it sounds: render the top-level component to a string and serve it up, and when loaded on the client the library will bind all the event handlers to the prerendered DOM.

The principle to learn is that things like DOM elements are basically native objects, like an open file instance. You don't stick user-land state onto file instances, do you? They are unserializable and slow. Since the DOM doesn't contain our app state, we just have to deal with a simple JavaScript object, declaratively render a structure based on it, and let the library figure out how to reify it into DOM elements.

The kicker is that the opportunity for great performance falls out of this naturally. React creates a lightweight Virtual DOM every time components are rendered, and diffs them to figure out the smallest amount of real DOM changes needed. The result is astonishing performance since DOM changes are the slowest part. Of course, you don't have to do this; Bloop naively sets `innerHTML` if the contents have changed, but the abstraction is there to allow great optimization.

Ok, enough philosophizing, let's get to some examples.

Looking at our app with tabs again, there is a [`Tabs`](https://gist.github.com/jlongster/3f32b2c7dce588f24c92#file-c-tabbed-app-js-L65) component. This is a completely stateless component, and the top-level `App` component actually handles the tab change and [changes `selectedItem` in the app state](https://gist.github.com/jlongster/3f32b2c7dce588f24c92#file-c-tabbed-app-js-L21). You might think that `Tabs` *should* handle the state to be reusable, but if you think about it, *something* needs to be hooked up to change the panes when a tab is changed. This makes the dependency on that state explicit and easy to rationalize about.

<a id="breakpoint-state1"></a>

In fact, all of our app state is a single object attached to the `App` component. It's easy to expose this as an editor, which is what you see below. This is the raw state of the app, and is synced both ways. Change it manually in the textarea below (change `bigFonts` to `true`, for example), and click around the app to watch changes come in. 

<div id="state-settings"><textarea>waiting on app state...</textarea></div>

When you change it in the textarea above, it is sent to the app and applied by running `app.state = JSON.parse(msg.data)`. It's that easy.

Generally, your app state will roughly correspond to your UI structure. I think this is what efforts like Web Components are trying to do (hide details about the UI structure), but it doesn't really work if you insist on still using the DOM. This is what you *really* want: a stripped down, bare representation of your app. Your UI structure falls out it of this, not the other way around.

<a id="breakpoint-state2"></a>

The app state is so *simple* and easy to access. Let's implement an undo system and see if we were telling the truth about how easy it is. Let's use a different example app for this: a basic twitter clone ([code here](https://gist.github.com/jlongster/3f32b2c7dce588f24c92#file-d-twitter-js)).

Type some messages into the text input, and press "enter" to submit them. Click the star to "star" a few of them. Now press the "undo" button several times and you will watch your previous actions wash away.

How is this implemented? Here is the code:

```js
var prevStates = [JSON.stringify(appState)];

function undo() {
  while(1) {
    var state = JSON.parse(prevStates.pop());

    if(!prevStates.length) {
      // This is the initial app state, so unconditionally apply it
      // and push it back onto the history so we don't lose it
      appState.feed = state.feed;
      prevStates.push(JSON.stringify(state));
      break;
    }
    else if(JSON.stringify(appState.feed) !== JSON.stringify(state.feed)) {
      // We found a state where the feed has changed, so apply it
      appState.feed = state.feed;
      break;
    }
  }
}

function render() {
  app.state = appState;
  var changed = Bloop.renderComponent(app, document.body);
  if(changed) {
    prevStates.push(JSON.stringify(appState));
  }
  requestAnimationFrame(render);
}

render();
```

All we have to do is save the app state when it is changed, and apply a previous state when an undo is requested. There are a few architecture-specific details here: `Bloop` doesn't currently have an event when the state changes, but `Bloop.renderComponent` does return if the rendered output has changed, so we use that to detect when we should save the state. And since we are using simple JavaScript objects, we use `JSON.parse` and `JSON.stringify` to take snapshots of the state. This is very simplistic, but you could implement more powerful ways to track changes like using persistent data structures.

Note that we only undo changes to the feed. In `undo`, we walk back through the history and find an app state where the `feed` structure has changed, skipping over any other state changes. It's up to you to determine what you want to track and undo.

If you're undoing UI that is backed by a data store, you also need to perform the undo in the backend. You can use a versioned data store, which makes it just as trivial. Or you can diff the app state and generate actions to perform the undo. This is something that needs to be explored more, and is the reverse of usual undo methods, where you manually undo changes in the database and then re-fetch data and refresh the whole UI. That might be just fine for your app, but it gets tedious to hand-code undo code paths for every single model. This is far more powerful because it's automatically applicable to any component.

Forcing your data through the backend data store to allow undo is also limiting. What if you want to not actually persist the action for 30 seconds, and give the user the chance to undo before it even hits the backend? Our architecture makes it trivial to go ahead and update the UI as if it has persisted in the data store, but let the user undo the action before it actually hits the backend. We get all of this for free.

[This pixel editor named Goya](http://jackschaedler.github.io/goya/), written in [Om](https://github.com/swannodette/om/) which is built on top of React, leverages this technique for tracking history, and allowing you to travel through changes. [Here's all the code](https://github.com/jackschaedler/goya/blob/master/src/cljs/goya/timemachine.cljs) it took to implement undo/redo. When it's independent of your data structure (as a good abstraction should be!) it's trivial!

One last example of explicit app state: prerendering and testing. Instead of using `Bloop.renderComponent`, you can use `Bloop.renderComponentToString` to render a component with properties to a string of HTML. This makes it trivial to test, just render the component and compare the output. This is the toolbar from the example on the right (if you [open the example](http://jlongster.com/s/bloop/app3/) in a tab, you can run this code from the console):

```js
Bloop.renderComponentToString(Toolbar({ username: 'foo' }))

// Output:
// "<div class="toolbar"><em>Logged in as foo</em><button>settings</button><button>undo</button></div>"
```

You might not want to compare strings directly, but you could do specific tests to make sure that changes in state relate to changes in structure.

If you want to prerender your app, you could simply render the top-level `App` component with the initial app state on the server and send it to the client. The library can then simply bind event listeners to the already rendered DOM (Bloop does not support this, but React does). It's literally just a few lines of code.

Bloop itself is extremely simplistic, but we already get most of this for free. React makes it easy to use these techniques for real apps because it handles all the hard stuff, too. There's a lot of win here, and a lot of opportunity for interesting advancements.


## Game Loop

So far, we've said that the structure of a component created within the `render` method is *declarative*. This is because you generate the structure based off of the app state, nothing else. As the app state changes, so does your structure. However, it may not look like traditionally declarative code, since any JavaScript can be run:

```js
Bloop.createClass({
  render: function() {
    var items = this.props.items.filter(function(item) {
      return item.isVisible;
    });
    
    return items.map(function(item) {
      return dom.div(item.name);
    });
  }
})
```

There is a declarative current running underneath this code. But we can look at it in a different light: almost as if we're operating in an [immediate rendering](http://en.wikipedia.org/wiki/Direct_mode) mode, as if the `dom.div` and such functions painted the element instantly. In fact, since we're using `requestAnimationFrame` to repaint the UI, this is extremely similar to how game developers render UI in games.

Game developers discovered [immediate-mode graphical user interfaces](https://mollyrocket.com/861) years ago (watch that video, it's awesome). Their power lies in the fact that you just run normal JavaScript to paint your UI: conditional elements are literally expressed as `if(shown) { renderItem(); }`, and that data is always synced with the UI because the UI is always redrawn.

The web traditionally operates in [retained mode](http://en.wikipedia.org/wiki/Retained_mode), where the DOM exists as an in-memory representation of the current UI, and you poke it to make changes. Since we can't throw away the current web, our library still creates DOM elements using our declarative forms. So we're basically operating in an immediate mode on top of a retained mode, and I'm starting to think that it actually gets us the best of both worlds. React provides "lifecycle" methods which trigger at various stages within the retained DOM, which gives you an escape hatch when you need to handle things like focus. Even if it might be better for React if there was a lower-level rendering API, just using the DOM works pretty well.

If our library can make edits to the retained DOM fast enough, we can actually treat our `render` methods as if they were in immediate mode. That means we can implement performance-sensitive things like 60 FPS animations, or a UI that changes when scrolling. You may think it's taboo not to use CSS for animations, but with `requestAnimationFrame` and other advancements, people are finding out that you can actually use JavaScript for better and even more performant animations, as seen with [Velocity.js](http://julian.com/research/velocity/).

React, with its Virtual DOM, is fast enough to implement animations that depend on user input, like scrolling or cursor position. Bloop is dumb and uses `innerHTML` so it's not nearly as good, but on desktop it's at least good enough to show an example.

A wonderful thing about immediate mode is that it's easy to do things like [occlusion culling](http://en.wikipedia.org/wiki/Hidden_surface_determination). Another corollary to graphics engines, occlusion culling is an algorithm to optimize rendering by figuring out which elements are actually visible, and only rendering them. Imagine you have a list of 5000 items. If you create a big `<ul>` with all of them, the DOM will grow large, take up lots of memory, and scrolling will be degraded (*especially* on mobile). If you know only 25 are on the screen at once, why do we need to create 5000 DOM elements?

<a id="breakpoint-game-loop1"></a>

You should only need 25 DOM elements at one time, and fill them out with the 25 elements that pass the occlusion test. I made this component in just a few minutes to make this work (view the full code [here](https://gist.github.com/jlongster/3f32b2c7dce588f24c92#file-e-optimized-list-js)):

```js
var App = Bloop.createClass({
  getInitialState: function() {
    return { pageY: 0,
             pageHeight: window.innerHeight };
  },

  componentDidRender: function() {
    var numItems = this.props.items.length;
    document.querySelector('.list').style.height = numItems * 31 + 'px';
    var ul = document.querySelector('ul');
    ul.style.top = this.state.pageY + 'px';
  },

  render: function() {
    var pageY = this.state.pageY;
    var begin = pageY / 31 | 0;
    // Add 2 so that the top and bottom of the page are filled with
    // next/prev item, not just whitespace if item not in full view
    var end = begin + (this.state.pageHeight / 31 | 0 + 2);

    var offset = pageY % 31;
    
    return dom.div(
      { className: 'list',
        style: 'position: relative; top: ' + (-offset) + 'px' },
      dom.ul(
        this.props.items.slice(begin, end).map(function(item) {
          return dom.li(null, item.title);
        })
      )
    );
  }
});
```

This assumes each list item has a height of `31px`, and can calculate which set of items are visible given the page scroll position and window height. The `render` method only returns a fixed size of `<li>` elements always (probably ~25), no matter how large the list is. The `<ul>` is shifted as the user scrolls so it actually stays in one place, but the outer container is given the full height of the list so that we still have an accurate scrollbar.

Go ahead, right-click and inspect one of the list elements in your browser's developer tools. Look around and you'll only see a modest number of `<li>` elements.

Here's the code for initializing and rendering this component:

```js
// application code

var items = [];
for(var i=0; i<5000; i++) {
  items.push({
    title: 'Foo Bar ' + i
  });
}

var app = App({ items: items });

window.addEventListener('scroll', function(e) {
  app.state.pageY = Math.max(e.pageY, 0);
  app.state.pageHeight = window.innerHeight;
});

// render

function render() {
  Bloop.renderComponent(app, document.body);
  requestAnimationFrame(render);
}

render();
```

When the `scroll` event is fired, we simply update `pageY` and `pageHeight` and the new DOM elements are filled with the right data, giving the illusion that the user is scrolling down a large list. This basic implementation isn't perfect, but it certainly could be with some better edge case handling.

This is all just with my stupid [Bloop](https://gist.github.com/jlongster/11192270) library, just imagine what you could do with React's optimizations.

<a id="breakpoint-game-loop2"></a>

Contrast this with what it would take to implement with Web Components. You would have to manually manage all of those DOM nodes yourself, and take special care to remove ones outside of the viewport, or even better reuse them and reposition them. Retained mode is a sucky way of doing UIs, and I think we'd all be better off if we switched to thinking in immediate mode.

## Additional Abstractions

### Cortex

We went over how data flows in Bloop and React: data is passed down and events are triggered up through event handlers. This is a good way for components to talk to each other, but it has drawbacks. Sometimes it's annoying to create many trivial event handlers, and you also *want* to be able to wrap state management into components instead of it all being top-level.

There are many ways to improve this, and React actually encourages its community to build interesting abstractions on top of React. [Cortex](https://github.com/mquan/cortex/) is one such enhancement of handling state.

Cortex is a way to have one single data structure for app state, but have the ability to take pieces of it and hand it off to child components. Child components have the ability to *change* state themselves, and we get update notifications. It's basically a type of "observable", but the difference is we don't care what has changed. When we get an update notification, we just trigger a rerender of the whole app.

Here's what using Cortex looks like:

```js
var data = { settings: { username: "James "},
             number: 0 };

var cortex = new Cortex(data, function() {
  // Called whenever an update happened
  Bloop.renderComponent(app, document.body);
});
```

In my component, if I had a `Settings` component I could pass it down like so:

```js
var App = Bloop.createClass({
  render: function() {
    return dom.div(
      MainContent(),
      Settings({ state: this.state.settings })
    );
  }
});
```

And the `Settings` component could update it like so:

```js
var Settings = Bloop.createClass({
  updateUsername: function(username) {
    this.state.username.set(username);
  },
  
  render: function() {
    // ...
  }
});
```

The callback we passed to `Cortex` would be called and the app would be rerendered. Now we can do more sophisticated state management, letting components manage the state themselves but still having full access to the state from the top-level through our normal `data` object. It's like proper Object-Oriented Programming!

Indeed, if you are familiar with [functional lenses](https://www.fpcomplete.com/school/to-infinity-and-beyond/pick-of-the-week/basic-lensing) this sounds all too familiar to you. Unfortunately, this is still a mutable data structure, but it still solves the encapsulation problem.

The above code is Bloop-specific. In React, you would need to access the cortex object in `props` in components that get state passed down. Bloop allows you to specify a `state` property when creating the component, and it is used as the component's initial state.

<a id="breakpoint-cortex1"></a>

Here is the full increment/decrement example using Cortex (or as a [gist](https://gist.github.com/jlongster/3f32b2c7dce588f24c92#file-f-cortex-js)):

```js
var dom = Bloop.dom;

// components

var App = Bloop.createClass({
  render: function() {
    return dom.div(
      dom.span(this.state.number.val()),
      Toolbar({
        number: this.state.number
      })
    );
  }
});

var Toolbar = Bloop.createClass({
  updateNumber: function(value) {
    this.props.number.set(value);
  },
  
  render: function() {
    return dom.div(
      dom.button({
        onClick: this.updateNumber.bind(null, this.props.number.val() - 1)
      }, 'decrement'),
      dom.button({
        onClick: this.updateNumber.bind(null, this.props.number.val() + 1)
      }, 'increment')
    );
  }
});

var data = { number: 0 };

var cortex = new Cortex(data, function() {
  // Called whenever an update happened
  Bloop.renderComponent(app, document.body);
});

// render

var app = App({ state: cortex });
Bloop.renderComponent(app, document.body);
```

### Bacon.js

If functional reactive programming (FRP) is your thing, I'm sure you've heard of [bacon.js](https://github.com/baconjs/bacon.js/tree/master). Since Bloop doesn't care where your data comes from, it's trivial to use FRP to construct data flows and update the UI whenever something comes down the stream. [This post](http://joshbassett.info/2014/reactive-uis-with-react-and-bacon/) describes how to do just that with bacon.js.

### Addon: Immutability Helper

React actually comes with an addon that lets you update data structures persistently, the [immutability helper](http://facebook.github.io/react/docs/update.html). The neat thing is that you can still use native JavaScript data structures, but create new objects when performing updates instead of mutating them directly.

It's a little unwieldy to use, however, but with some [macro magic](http://sweetjs.org/) it could be quite handy.

### Om

[Om](https://github.com/swannodette/om/) is a much more sophisticated abstraction on top of React. It is a ClojureScript interface to React that [introduces](http://swannodette.github.io/2013/12/17/the-future-of-javascript-mvcs/) a different way of defining components and managing state. Since ClojureScript uses persistent data structures natively, app state is immutable and persistent. This immutability makes it trivial to check what has changed, since you just have to compare pointers.

Om uses `requestAnimationFrame` to <del>render the app continuously</del> batch rendering (all requests for rerendering happen just once on the next animation frame). If something has changed, it's very quick to detect the components that have changed with a few more pointer checks and rerender those components.

Immutability turns out to be an incredible companion to React, making not only app state explicit but also changes over time. Keeping a history involves only keeping pointers to previous app states.

I would love to dive into this more, but that is for a future post.

### Mori

[Mori](https://github.com/swannodette/mori) is a library for persistent data structures for JavaScript. These are same data structures used by ClojureScript. If you want a lot of the same benefits that Om takes advantage of, like optimized rendering and easy history and undo, you can use this library to manage app state as a persistent data structure.

I haven't seen too many persistent JavaScript react apps yet, but there is [this post](http://tech.kinja.com/immutable-react-1495205675) about using a [different](https://github.com/hughfdjackson/immutable) persistent data structure library for building apps.

<a id="breakpoint-finale"></a>

## Finale

We've shown how React chooses a level of abstraction that is powerful, and also adaptive. We haven't explored the details of React's optimizations with the virtual DOM, but you can find more about that in the [docs](http://facebook.github.io/react/docs/getting-started.html) and around the web. I wanted to focus on the abstract idea itself, and show how well it works even with my stupidly simple Bloop library.

Bloop follows most of React's APIs and conventions, with the following differences: in React, the properties object is required when creating DOM elements, so you have to pass `null` if there aren't any (`dom.div(null, 'text')`). There also is no `componentDidRender` in React, but there is `componentDidUpdate`.

This post assumes Web Components as a way to build applications; some people look at Web Components as a low-level way to share custom components. Even so, everything is stuck in a global namespace and you miss out on all the goodness of modules. Also, it's a hard sell when something like React can't even use it, and it's hard to load in components from a completely different system, especially when you want to take advantage of what you already have.

There's no doubt that you will need more than this for building apps: we haven't mentioned routing, data stores, controllers, and all that stuff. I like the ability to choose which libraries to use and see how they are all pieced together. See React's post about the [flux](http://facebook.github.io/react/blog/2014/05/06/flux.html) architecture, a [router](https://github.com/andreypopp/react-router-component), and [more](https://medium.com/react-tutorials/c00be0cf1592).

It's no coincidence that immutability and persistence was repeatedly referenced throughout this post. Using persistent data structures with this architecture really does allow for powerful features. However, even with simple mutable JavaScript objects, React brings a powerful UI and component system to the table.

Read more:

* [Bloop](https://gist.github.com/jlongster/11192270)
* [Source code](https://gist.github.com/jlongster/3f32b2c7dce588f24c92) for all the demos
* React [docs](http://facebook.github.io/react/)
* React provides [JSX](http://facebook.github.io/react/docs/jsx-in-depth.html), an extension to JavaScript, which allows you to embed HTML directly in JavaScript. This makes it look like you are writing HTML, but all it does it transform to the native `dom.*` calls. I prefer not to use it, but it's helpful if you are working with designers.
* [Om](https://github.com/swannodette/om/) is a ClojureScript interface to React
* [Mori](http://swannodette.github.io/mori/) is a library of persistent data structures for JavaScript
* [Cortex](https://github.com/mquan/cortex/) provides a way to centrally manage data
* [Mercury](https://github.com/Raynos/mercury) is an attempt to rebuild something like React, separating functionality into lots of modules like [virtual-dom](https://github.com/Matt-Esch/virtual-dom). It features immutable-by-default state and virtual DOM, see more comparison [here](https://github.com/Raynos/mercury#mercury-vs-react).
* [Mithril](http://lhorie.github.io/mithril/) is another framework that has similar ideas, and the author has commented and ported my examples [here](http://lhorie.github.io/mithril-blog/an-exercise-in-awesomeness.html).

<script src="http://jlongster.com/s/jlongster.com-util/jquery-2.1.0.min.js"></script>
<script src="http://jlongster.com/s/jlongster.com-util/underscore-min.js"></script>
<script src="http://jlongster.com/s/shift/build/lib/react.dev.js"></script>
<script src="http://jlongster.com/s/shift/build/shift.js"></script>
<link rel="stylesheet" type="text/css" href="http://jlongster.com/s/shift/build/shift.css" />