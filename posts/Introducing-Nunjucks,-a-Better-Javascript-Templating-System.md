---
published: true
shorturl: "Introducing-Nunjucks,-a-Better-Javascript-Templating-System"
tags: ["js"]
date: "September 20, 2012"
---

# Introducing Nunjucks, a Better Javascript Templating System

I've been trying to embrace node.js for web application development in the past year, but one thing has continually stumped me: **templates**.

In my opinion, there just isn't a great templating engine out there for javascript. [jade](http://jade-lang.com/) looks very cool, but it's so different that it's difficult for people that aren't used to it. Personally, I don't like the whitespace-based approach either.

[EJS](https://github.com/visionmedia/ejs) is arguably the most popular one for node, but it is *quite ugly*. It literally embeds javascript in HTML. Want to loop over items? Write a `for(var i=0; i<length; i++)` loop. Not only is it ugly, it's too much logic in templates.

[mustache](http://mustache.github.com/) is probably the best out there *so far*.

Most of these don't support advanced mechanisms like **template inheritance** though. Jade does, but its syntax only tailors to a certain crowd. Most of them embrace a concept called "partials" which simply lets you include other templates <sup><a href="#footnote1">[1]</a></sup>. But  "partials" don't scale. When building complex web apps, template inheritance lets you reuse templates much more gracefully.

Finally, there are [several](https://github.com/sirlantis/liquid-node) [other](http://paularmstrong.github.com/swig/) attempts at bringing better templates to node, particularly [jinjs](https://github.com/ravelsoft/node-jinjs). Most of them haven't been updated in almost a year, and lack documentation. [swig](http://paularmstrong.github.com/swig/) looks the nicest, and I found it halfway through this, but I would rather adopt jinja's syntax over django's.

## Making it Better with Nunjucks

I'm happy to release [nunjucks][] into the wild today, which should solve many of the problems mentioned above.

It is a direct port of [jinja2](http://jinja.pocoo.org/). jinja2 has proven to be a robust and well-liked templating system. I think the node community could learn from some of Python's packages.

```
{% extends "layout.html" %}
{% block body %}
  <ul>
  {% for user in users %}
    <li><a href="{{ user.url }}">{{ user.username }}</a></li>
  {% endfor %}
  </ul>
{% endblock %}
```

[Nunjucks][] implements a full lexer and parser which generates an AST, and a compiler which compiles it to raw javascript. This method makes templating very fast, and allows you to precompile your templates.

It's just as fast as jinja2, with rendering time in the order of milliseconds.

It also completely supports client-side rendering in the browser, which is something jinja2 can't do. This allows you to prerender complex pages, and use the same templates to change the page when your application receives new data. Nunjucks has **zero** dependencies so loading it in the browser doesn't load anything else.

For client-side rendering, you can precompile your templates for production and then you only need an 8K javascript file to run them. Nunjucks is fast and small for this reason. See [documentation](http://nunjucks.jlongster.com/api#Using-Nunjucks-in-the-Browser) on client-side support.

Most of jinja2's features are supported, like template inheritance, blocks, filters, and more. You can see the missing features [here](http://nunjucks.jlongster.com/differences).

I hope you find this useful. I sure already am. I will be using this for months/years to come, so don't expect it to go away any time soon.

If you have any questions or comments, please [file a github issue](https://github.com/jlongster/nunjucks/issues)!

[Nunjucks]: http://nunjucks.jlongster.com

<sup id="footnote1">[1] <a href="http://twitter.github.com/hogan.js/">hogan.js</a>, twitter's implementation of mustache, implements template inheritance but it is <a href="https://github.com/twitter/hogan.js/issues/70">undocumentated</a> and <a href="https://github.com/twitter/hogan.js/blob/master/test/index.js#L713">ugly</a>, requiring you to manually compile all the templates beforehand.</sup>