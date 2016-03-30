---
tags: ["react"]
headerimg: "http://jlongster.com/s/posts/react-native.png"
published: true
date: "February 6, 2015"
readnext: "Removing-User-Interface-Complexity,-or-Why-React-is-Awesome"
abstract: "React Native is a new way to build native apps, using all the same technology you learned with React.js. It's amazing. In this article I give a demo of my first app built with it and explain the experience."
shorturl: "First-Impressions-using-React-Native"
---

# First Impressions using React Native

Facebook gave all attendees of [React Conf](http://conf.reactjs.com/) early access to the source code of [React Native](https://www.youtube.com/watch?v=KVZ-P-ZI6W4), a new way to write native mobile apps. The technology takes everything that's great about React.js and applies it to native apps. You write JavaScript components using a set of builtin primitives that are backed by actual native iOS or Android components.

First off, I know it sucks it's not completely public yet. Facebook isn't yet fully open-source, so it takes time to move projects into an open light. They are working on removing code specific to their environment and setting up a process to receive contributions. I think it's great they strive to be more open, and they care deeply about the React community. The project will be fully open-sourced soon.

I don't find anything fundamentally wrong with the slow release. I'm happy to discuss it with you if do. But let's **please** leave that for another discussion.

Because if you decide to get distracted by it, you might miss *a huge shift* in how we write native apps. The best part about this shift is that it's more like web apps.

I developed iOS apps for a few years, so I have experience with native development. After using React Native, I can only explain it like this:

![](http://jlongster.com/s/posts/jawdrop.png)

We've all heard the promise of cross-platform native apps driven by JavaScript. [Titanium](http://www.appcelerator.com/), [PhoneGap](http://phonegap.com/), and other projects allow various levels of hooking in with the native environment. All of them fall short. Either you're just wrapping a web app in a web view, or they try to mimick HTML & CSS which is hard to build apps with. With the latter, you're also interfacing directly with native objects *all the time*, which is doomed to fail performance-wise. React Native actually performs the layout on a separate thread, so the main thread is as free as it can possibly be to focus on smooth animations (it also provides [flexbox](http://css-tricks.com/snippets/css/a-guide-to-flexbox/) for layout, which something that <strike>no other framework provides</strike> few other frameworks provide (ionic [does](http://learn.ionicframework.com/formulas/using-the-grid/), which is cool!)).

It only takes a few minutes playing with React Native to realize the potential it has. This *works*. It feels like I'm developing for the web. But I'm writing a real native app, and you *seriously* can't tell the difference. At the UI level, there is no difference; these are all native UIViews beautifully sliding around like normal.

This is *solid* engineering. And it completely reinforces the fact that **React.js is the right way to build apps**. I can write a native app *using the same techniques* as I would write web app. Let's start treating the DOM as an implementation detail, just like UIViews.

I love the web. But if we don't take a step and take a critical look at what's wrong, we might miss out on something big. The web is fundamentally weird to build apps on: the mess of HTML and CSS get *in the way* of frameworks instead of helping them. Perhaps React Native will finally drive this point home. I look forward to seeing how it will push the web to become a better platform for apps. Instead of thinking of it as moving away from the web, think of it as a prototype for a different direction of the web.

Are you feeling giddy yet?! I'll tell you how React Native works! You can learn more the videos from React Conf [here](https://www.youtube.com/watch?v=KVZ-P-ZI6W4) and [here](https://www.youtube.com/watch?v=7rDsRXj9-cU).

React Native uses JavaScriptCore in iOS to run JavaScript (Android and other platforms will be supported in the future). The important part is that it runs JavaScript on a separate thread (other frameworks like Titanium do as well). You write your components in JavaScript just like you would with React.js, except instead of using `div` and `a` you use things like `View` and `Text`. You get all the benefits of React's composability for building UIs (which, safe to say, is **awesome**). And remember, JavaScript is not just a language but a platform, and there is large number of wonderful compile-to-JS languages to pick from.

React Native takes your UI and sends the minimal amount of data to the main thread to render it with native components. A `View` is a `UIView`, for example. The best part is, you don't have to worry about updating your UI; you declaratively render your UI based on some state, and React uses a diffing algorithm to send the smallest amount of changes necessary over the bridge.

Writing native UIs has never been easier, and additionally there is *no* performance impact on things like animations because JS is running on a separate thread. Smooth as butta.

## An OpenGL App with React Native

My first React Native app is a non-traditional one: I wrote a 3d Wavefront obj model viewer. I've always been interested in game development, but I hated writing native UIs. React Native just gave me the web for game UIs.

I'm sure you'll see a lot of traditional app demos with native navigation and animation and all that. I thought it would be cool to show that it's just as easy to throw React Native on top of an OpenGL view.

All you have to do to integrate React Native is create an `RCTRootView` in your controller, tell it where your JS lives, and add it to the window. In my case, I first create an OpenGL view, and I add the `RCTRootView` as a subview on top of it. Integration was painless.

![](http://jlongster.com/s/posts/react-native-demo.gif)

You can press Cmd+R to instantly refresh the UI and pick up any changes you made. Only the `RCTRootView` will update, so I can easily build out and refresh my UI without having to reload the OpenGL layer!

Here's an example component, `ObjList`, that lists available files and loads a mesh when an item is clicked. This uses a `ListView` which is a native scroll view that only renders the rows within view, like any native app does. Using it here is much simpler though.

```js
var ObjList = React.createClass({
  // a few methods clipped....

  selectModel: function(file) {
    controller.loadMesh(file);
  },

  renderRow: function(file) {
    return View(
      null,
      TouchableHighlight(
        { onPress: () => this.selectModel(file),
          underlayColor: 'rgba(0, 0, 0, .6)' },
        Text({ style: { height: 30, color: 'white' }}, file)
      )
    );
  },

  render: function() {
    var source = this.getDataSource(this.props.files);

    return ListView({
      style: { flex: 1 },
      renderRow: this.renderRow,
      dataSource: source
    });
  }
});
```

In my `App` component I have a `handleSearch` method that fires when the text input changes. I just change the state, which rerenders the app and the `ObjList` component with the new state, showing only the new list of files.

```js
handleSearch: function(e) {
  var text = e.nativeEvent.text;
  var files = allFiles.filter(x => x.indexOf(text.toLowerCase()) !== -1);
  this.setState({ files: files });
}
```

Notice the `controller.loadMesh()` call in the `ObjList` component. That is an Objective-C method that I've marked as exported, and the bridge will pick it up and make it available the JS. Working with the bridge was pretty easy, and it will only get better from here. Here's the implementation of `loadMesh`:

```c
- (void)loadMesh:(NSString *)path {
    RCT_EXPORT();

    dispatch_async(dispatch_get_main_queue(), ^{
        teapotNode_.material.diffuse = [self randomColor];
        teapotNode_.wavefrontMeshA = [REMeshCache meshNamed:path];
        [self reset];
    });
}
```

`RCT_EXPORT()` marks it as a method to export (there's a little more work to actually instantiate the class somewhere else). These methods are invoked on a separate thread, but I need to load the mesh on the main thread (since it will load data into OpenGL), so I queue a block of code to be run on the main thread.

Here's a video going through it more detail:

<iframe width="700" height="394" src="https://www.youtube.com/embed/OPFf53fdUmQ" frameborder="0" allowfullscreen></iframe>

The ability to declaratively construct my UI as components and respond to events by simply changing state is powerful. React.js has proven that. Suddenly, we get to do the *exact* same thing for native apps. "Learn once, write anywhere" as the React devs say. Also see: [Facebook just taught us all how to build websites](https://medium.com/@ericflo/facebook-just-taught-us-all-how-to-build-websites-51f1e7e996f2).



