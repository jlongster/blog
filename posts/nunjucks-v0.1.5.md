---
published: true
shorturl: "nunjucks-v0.1.5"
tags: ["js"]
date: "October 11, 2012"
---

# Nunjucks v0.1.5: Macros, Keyword Args, bugfixes

I just released version 0.1.5 of [Nunjucks](http://nunjucks.jlongster.com/), a port of the jinja2 templating system to javascript that I've been working on. I don't normally post about new versions of libraries I'm working on, but since nunjucks is pretty new there's a lot happening with it.

Another reason I'm posting is to announce the [nunjucks changelog](http://nunjucks.tumblr.com/post/33376448796/v0-1-5-macros-keyword-arguments-bugfixes) tumblr site. I've been thinking about how to communicate changes with users, and I'd rather not post here for every release. If you want to follow nunjucks, you can subscribe to that feed.

Several people have expressed interest in it, with a few already building out sites with it. It's clear to me that there's definitely room for nunjucks, and I fully intend to continue working on it. There are still several features missing from jinja2.

## Macros

**So what's new?** Per [the prioritized list](http://nunjucks.jlongster.com/differences) of things to do, autoescaping was #1. Unfortunately it is not finished yet. It will be done in the next week or two. [Brent Hagany](https://github.com/bhagany) contacted me about **macros** and was eager to implement them, and a few days later a pull request appeared with an implementation of [macros](http://nunjucks.jlongster.com/templating#Macro). I was excited to receive such a huge contribution. Thanks Brent!

I refactored some parts of the code to make sure it behaved consistently everywhere and added a bunch of tests, and now we have macros!

[Macros](http://nunjucks.jlongster.com/templating#Macro) allow the designer to define reusable template chunks. Check out the documentation for examples.

## Keyword Arguments

jinja2's macros support keyword arguments, which is easy because it uses Python's builtin support. This posed an interesting question: should nunjucks support them as well, and require a special javascript calling convention?

Initially I was against it because it would make the code too complex, and I wanted to stick to raw javascript. However, I was persuaded because a lot of jinja2 users are going to expect this, and you can also use them to supply default arguments, which is nice.

I made up a new calling convention. If you call any function like this in nunjucks:

```
{{ foo(x, y, z=5, w=6) }}
```

The keyword arguments are simply converted into a hash and passed in as the last argument. It's exactly the same thing as this in javascript:

```
foo(x, y, { z: 5, w: 6 })
```

This was really simple to implement, and goes a long way. All filters, as well as functions that have been passed in, can consume keyword arguments if they want. Just write a filter like this:

```js
env.addFilter('foo', function(x, y, kwargs) {
    return x + y + (kwargs.z || 5) + (kwargs.w || 6);
});
```

`opts` might be a more appropriate name, depending on what you're doing.

This approach has limitations: as it stands, you *must* provide all positional arguments before specifying keyword args. You also can't "fill in" a keyword argument with a normal positional arg.

Macros can also be defined with keyword arguments, which lets you supply default values easily:

```
{% macro field(name, value, type='text') %}
<input type={{ type }} name={{ name }} value={{ value }} />
{% endmacro %}
```

People will trip up on this if they can't mix positional/keyword arguments like they can in Python, so macros have a special translation layer that destructures arguments when macros are called. Brent did a great job implementing something similar, but it wasn't compatible with the new calling convention, so I refactored it.

The result is that you can call macros and mix positional/keyword arguments. With the above macro, these are all valid ways to call it:

```
{{ field('user') }}
{{ field('user', 'james') }}
{{ field('user', 'james', 'text') }}
{{ field('user', type='text') }}
{{ field(name='user', value='james', type='text') }}
```

And it all works as you'd expect. Obviously, that doesn't work for javascript functions/filters.

## Moar Bugs?

The rest of 0.1.5 includes several bug fixes and tweaks to some of the scoping rules that adheres closer to jinja2.

This release includes a lot of new or changed code, so please [let me know](https://github.com/jlongster/nunjucks/issues?state=open) if you have any issues with it!
