---
abstract: "A little while ago I briefly talked about my latest blog rewrite and promised to go more in-depth on specific things I learned. Today I'm going to discuss various ways to use immutable data structures in JavaScript."
shorturl: "Using-Immutable-Data-Structures-in-JavaScript"
tags: ["blog","immutable"]
published: true
date: "October 1, 2015"
---

# Immutable Data Structures and JavaScript 

A [little while ago](http://jlongster.com/The-Seasonal-Blog-Redux) I briefly talked about my latest blog rewrite and promised to go more in-depth on specific things I learned. Today I'm going to talk about immutable data structures in JavaScript, specifically two libraries [immutable.js](https://github.com/facebook/immutable-js) and [seamless-immutable](https://github.com/rtfeldman/seamless-immutable). There are other libraries, but the choice is conceptually between truly persistent data structures or copying native JavaScript objects, and comparing these two highlights the tradeoffs, no matter what specific library you choose [\[1\]](#footnote1). I'll also talk a little about [transit-js](https://github.com/cognitect/transit-js), which is a great way to serialize anything.

Very little of this applies specifically to [Redux](https://github.com/rackt/redux). I talk about using immutable data structures generally, but provide pointers for using it specifically in Redux. In Redux, you have a single app state object and update it immutably, and there are various ways to achieve this, each with tradeoffs. I explore this below.

One thing to think about with Redux is how you combine [reducers](http://rackt.github.io/redux/docs/basics/Reducers.html) to form the single app state atom; the default method that Redux provides (`combineReducers`) assumes that you are combining multiple values into a single JavaScript object. If you really want to combine them into a single Immutable.js object, for example, you would need to write your own `combineReducers` that does so. This might be necessary if you need to serialize your app state and you assume that it's entirely made up of Immutable.js objects.

Most of this applies to using immutable objects in JavaScript in general. It's a bit awkward sometimes because you're fighting the default semantics, and it can feel like you're juggling types. However, depending on your app and how you set things up, you can get a lot out of it.

Currently there is [a proposal](https://github.com/sebmarkbage/ecmascript-immutable-data-structures) for adding immutable data structures to JavaScript natively, but it's not clear if it will work out yet. It would certainly remove most problems with using them in JavaScript currently.

## Immutable.js

[Immutable.js](https://github.com/facebook/immutable-js) comes from Facebook and is one of the most popular implementations of immutable data structures. It's the real deal; it implements fully persistent data structures from scratch using advanced things like [tries](https://en.wikipedia.org/wiki/Trie) to implement structural sharing. All updates return new values, but internally structures are shared to drastically reduce memory usage (and GC thrashing). This means that if you append to a vector with 1000 elements, it does *not* actually create a new vector 1001-elements long. Most likely, internally only a few small objects are allocated.

The advancements of structural sharing data structures, greatly helped with the [groundbreaking work](http://www.amazon.com/Purely-Functional-Structures-Chris-Okasaki/dp/0521663504) by Okasaki, has all but shattered the myth that immutable values are too slow for Real Apps. In fact, it's surprising how many apps can be made *faster* with them. Apps which read and copy data structures heavily (to avoid being mutated from someone else) will easily benefit from immutable data structures (simply copying a large array once will diminish your performance wins from mutability).

Another example is how [ClojureScript](https://github.com/clojure/clojurescript) discovered that UIs are given a huge performance boost when backed by immutable data structures. If you're mutating a UI, you commonly touch the DOM more than necessary (because you don't know whether the value needs updating or not). React will minimize DOM mutations, but you still need to generate the virtual DOM for it to work with. When components are immutable, you don't even have to generate the virtual DOM; a simple `===` equality check tells you if it needs to update or not.

Is it Too Good to Be True? You might wonder why we don't use immutable data structures all the time with the benefits they provide. Well, some languages do, like ClojureScript and Elm. It's harder in JavaScript because they are not the default in the language, so we need to weigh the pros and cons.

### Space and GC Efficiency

I already explained why structural sharing makes immutable data structures efficient. Nothing is going to beat mutating an array at an index, but the overhead of immutability isn't large. If you need to avoid mutations, they are going to beat copying objects hands-down.

In Redux, immutability is enforced. You won't see any updates on the screen unless you return a new value. There are big wins because of this, and if you want to avoid copying you might want to look at Immutable.js.

### Reference & Value Equality

Let's say you internally stored a reference to an object, and called it `obj1`. Later on, `obj2` comes down the pipe. If you never mutate objects, and `obj1 === obj2` is true, you know absolutely nothing has changed. In many architectures, like React, this allows you easily do powerful optimizations.

That's called "reference equality," where you can simply just compare pointers. But there's also the concept of "value equality," where you can check if two objects are identical by doing `obj1.equals(obj2)`. When things are immutable, you treat objects as just values.

In ClojureScript everything is a value, and even the default equality operator performs the value equality check (as if `===` would). If you actually wanted to compare instances you would use `identical?`. The benefit of value equality with immutable data structures is that it can usually do the checks more performantly than a full recursive scan (if it shares structure it can skip that part).

So where does this come into play? I already explained how it makes optimizing React trivial. Just implement `shouldComponentUpdate` and check if the state is identical, and skip rendering if so.

I also discovered that while using `===` with Immutable.js does not perform a value equality check (obviously, you can't override JavaScript's semantics), Immutable.js uses value equality for identities of objects. Anywhere that it wants to check if objects are the same, it uses value equality.

For example, keys of a `Map` object are value equality checked. This means I can store an object in a `Map`, and retrieve it later just by supplying an object of the same shape:

```js
let map = Immutable.Map();
map = map.set(Immutable.Map({ x: 1, y: 2}), "value");
map.get(Immutable.Map({ x: 1, y: 2 })); // -> "value"
```

This has a *lot* of really nice implications. For example, let's say I have a function that takes a query object that specifies fields to pull from a server:

```js
function runQuery(query) {
  // pseudo-code: somehow pass the query to the server and 
  // get some results
  return fetchFromServer(serialize(query));
}

runQuery(Immutable.Map({
  select: 'users',
  filter: { name: 'James' }
}));
```

If I wanted to implement query caching, this is all I would have to do:

```js
let queryCache = Immutable.Map();
function runQuery(query) {
  let cached = queryCache.get(query);
  if(cached) {
    return cached;
  } else {
    let results = fetchFromServer(serialize(query));
    queryCache = queryCache.set(query, results);
    return results;
  }
}
```

I can treat the query object as a value, and store the results with it as a key. Later on, if something runs the same query, I'll get back the cached results even if the query object isn't the same instance.

There are all sorts of patterns that value equality simplifies. In fact, I do the exact same technique when [querying for posts](https://github.com/jlongster/blog/blob/master/src/reducers/posts.js#L34).

### JavaScript Interop

The major downside to Immutable.js data structures is the reason that they are able to implement all the above features: they are not normal JavaScript data structures. An Immutable.js object is completely different from a JavaScript object.

That means you must do `map.get("property")` instead of `map.property`, and `array.get(0)` instead of `array[0]`.  While Immutable.js goes to great lengths to provide JavaScript-compatible APIs, even they are different (`push` must return a new array instead of mutating the existing instance). You can feel it fighting the default mutation-heavy semantics of JavaScript.

The reason this makes things complicated is that unless you're really hardcore and are starting a project from scratch, you can't use Immutable objects everywhere. You don't really need to anyway for local objects of small functions. Even if you create every single object/array/etc as immutable, you're going to have to work with 3rd party libraries which use normal JavaScript objects/arrays/etc.

The result is that you never know if you are working with a JavaScript object or an Immutable one. This makes reasoning about functions harder. While it's possible to be clear where you are using immutable objects, you still pass them through the system into places where it's not clear.

In fact, sometimes you might be tempted to put a normal JavaScript object inside an Immutable map. Don't do this. Mixing immutable and mutable state in the same object will reap confusion.

I see two solutions to this:

1. **Use a type system like TypeScript or Flow**. This removes the mental burden of remembering where immutable data structures are flowing through the system. Many projects are not willing to take this step though, as it requires quite a different coding style.

2. **Hide the details about data structures**. If you are using Immutable.js in a specific part of your system, don't make anything outside of it access the data structures directly. A good example is Redux and it's single atom app state. If the app state is an Immutable.js object, don't force React components to use Immutable.js' API directly.

  There are two ways to do this. The first is to use something like [typed-immutable](https://github.com/gozala/typed-immutable) and actually *type* your objects. By creating records, you get a thin wrapper around an Immutable.js object that provides a `map.property` interface by defining getters based on the fields provided by the record type. Everything that just reads from the object can treat it like a normal JavaScript object. You can't mutate it still, but that's something you actually want to enforce.
  
  The second method is to provide a way to query objects and force anything that wants to read to perform a query. This doesn't work in general, but it works really well in the case of Redux because we have a single app state object, and you want to hide the data layout anyway. Forcing all React components to depend on the data layout means you can never change the actual structure of the app state, which you'll probably want to do over time.
  
  Queries don't have to be a sophisticated engine for deep object querying, they can just be simple function. I'm not doing this in my blog yet, but imagine if I had a bunch of functions like `getPost(state, id)` and `getEditorSettings(state)`. These all take state and return what I am "querying" just by using the function. I no longer care about where it lives within the state. The only problem is that I might still return an immutable object, so I might need to coerce that into a JavaScript object first or use a record type as described above.
  
To sum it all up: JavaScript interop is a real issue. Never reference JavaScript objects from Immutable ones. Interop issues can be mitigated with record types as provided with [typed-immutable](https://github.com/gozala/typed-immutable), which have other interesting benefits like throwing errors when mutating or reading invalid fields. Finally, if you're using Redux, don't force everything to depend on the app state structure, as you'll want to change it later. Abstract the data implementation away, which solves the problem with immutable interop.

## seamless-immutable

There's another way to enforce immutability. The [seamless-immutable](https://github.com/rtfeldman/seamless-immutable) project is a much lighter-weight solution that uses normal JavaScript objects. It does not implement new data structures, so *there is no structural sharing*, which means you will copy objects as you update them (however, you only need a shallow copy). You don't get any of the performance or value equality benefits explained above.

However, in return you get excellent JavaScript interop. All the data structures are quite literally JavaScript data structures. The difference is that that seamless-immutable calls `Object.freeze` on them, so you cannot mutate them (and strict mode, which is the default with ES6 modules, will throw errors on mutation). Additionally, it adds a few methods to each instance to aid in updating the data, like `merge` which returns a new object with the supplied properties merged in.

It's missing a few common methods for updating immutable data structures, like Immutable.js' [`setIn`](http://facebook.github.io/immutable-js/docs/#/Map/setIn) and [`mergeIn`](http://facebook.github.io/immutable-js/docs/#/Map/mergeIn) methods which makes it easy to update a deeply nested object. But these are easily implemented and I plan to contribute these to the project.

It's impossible to mix immutable and mutable objects. seamless-immutable will deeply convert all objects to be immutable when wrapping an instance with it, and any added values are automatically wrapped. In practice Immutable.js works very similarly, where `Immutable.fromJS` deeply converts, as well as various methods like `obj.merge`. But `obj.set` does not automatically coerce, so you can store any data type you like. This is not possible with seamless-immutable, so you cannot accidentally store a mutable JavaScript object.

In my opinion, I would expect each library to behave the way they currently do; they have different goals. For example, because seamless-immutable automatically coerces, you cannot store any type that it is not aware of, so it won't play nicely with anything but basic builtin types (in fact, it does not even support `Map` or `Set` types right now).

seamless-immutable is a tiny libary with big wins, but also loses out on some fundamental advantages of immutable data structures like value equality. If JavaScript interop is a huge concern for you, it's a fantastic solution. It's especially helpful if you're migrating existing code, as you can slowly make things immutable without rewriting every piece of code that touches them.

## The Missing Piece: Serializing with transit-js

There's one last piece to consider: serialization. If you're using custom data types, `JSON.stringify` is no longer an option. But `JSON.stringify` was never very good anyway, you can't even serialize ES6 `Map` or `Set` instances.

[transit-js](https://github.com/cognitect/transit-js) is a great library written by [David Nolen](https://twitter.com/swannodette) that defines an extensible data transfer format. By default you cannot throw `Map` or `Set` instances into it, but the crucial difference is that you can easily transcribe custom types into something that transit understands. In fact, the [full code](https://github.com/glenjamin/transit-immutable-js/blob/master/index.js) for serializing and deserializing the entire set of Immutable.js types is less than 150 lines long.

Transit is also much smarter about how it encodes types. For example, it knows that map keys might be complex types as well, so it's easy to tell how it how to serialize `Map` types. Using the [`transit-immutable-js`](https://github.com/glenjamin/transit-immutable-js) library (referenced above) to support Immutable.js, now we can do things like this:

```js
let { toJSON, fromJSON } = require('transit-immutable-js');

let map = Immutable.Map();
map = map.set(Immutable.Map({ x: 1, y: 2 }), "value");

let newMap = fromJSON(toJSON(map));
newMap.get(Immutable.Map({ x: 1, y: 2 })); // -> "value"
```

Value equality combined with transit's easy-breezy map serialization gives us a simple way to use these patterns consistently across any system. In fact, my blog builds the query cache on the server when server-rendering and then sends that cache to the client, so the cache is still fully intact. This use case was actually the main reason I switched to transit.

It would be easy to serialize ES6 `Map` types as well, but if you have complex keys I'm not sure how you would use the unserialized instance without value equality. There are still probably uses for serializing them though.

If you have mixed normal JavaScript objects and Immutable.js objects, serializing with transit will also keep all those types in tact. While I recommend against mixing them, transit will deserialize each object into the appropriate type, whereas using raw JSON means you'd convert everything to an Immutable.js type when deserializing (assuming you do `Immutable.fromJS(JSON.parse(str))`).

You can extend transit to serialize anything, like `Date` instances or any custom types. Check out [transit-format](https://github.com/cognitect/transit-format) for how it encodes types.

If you use seamless-immutable, you are already restricting yourself to only use builtin JavaScript (and therefore JSON-compatible) types, so you can just use `JSON.stringify`. While simpler, you lose out on the extensibility; it's all about tradeoffs.

## Conclusion

Immutability provides a lot of benefits, but whether or not you need to use full-blown persistent data structures provided by Immutable.js depends on the app. I suspect a lot of apps are fine copying objects, as most of them are relatively small.

You win simplicity at the cost of features though; not only is the API a lot more limited you don't get value equality. Additionally, it may be hard later on to switch to Immutable.js if you find out you need the performance gains of structural sharing.

Generally I would recommend hiding the data structure details, especially if you use Immutable.js, to the outside world. Try to conform to JavaScript's default protocols for objects and arrays, i.e. `obj.property` and `arr[0]`. It should be possible to quickly wrap Immutable objects with these interfaces, but more research is needed.

This is especially true in Redux, where you *will* want to change how the app state is structured in the future. You have this problem even if your app state is a normal JavaScript object. Outside users shouldn't break if you move things around in the app state. Provide a way to query the app state structure instead, at least just by abstracting out data accesses with functions. More complex solutions like [Relay](https://github.com/facebook/relay) and [Falcor](http://netflix.github.io/falcor/) solve this too because a query language is the default way to access data.

<a id="footnote1"></a>
<p style="font-size: .9em">[1] <a href="http://swannodette.github.io/mori/">mori</a> is another persistent data structure implementation (pulled out from ClojureScript), and <a href="https://facebook.github.io/react/docs/update.html">React's immutability helpers</a> is another library that simply shallow copies native JavaScript objects</p>

<a id="footnote2"></a>
<p style="font-size: .9em">[2] I made <a href="https://gist.github.com/jlongster/bce43d9be633da55053f">a gist</a> of all the existing libraries I know of that help with immutability.</p>
