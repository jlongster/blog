---
published: true
shorturl: "dom3d--rendering-3d-with-CSS"
tags: ["css"]
date: "August 4, 2011"
---

# dom3d: rendering 3d with CSS

A few months ago I wrote a library which renders 3d objects into the DOM using CSS3 transforms. It's a fun hack, featuring animations and shading.

[View the demo site](/s/dom3d)

I have new ideas for this library which will make it more appropriate for web sites. Right now, it attempts to fully support any 3d object made up of triangles. This requires a bunch of hacks to the DOM which break away from a normal web experience.

With the new 3d CSS transforms, it should be possible to render 3d objects only composed of rectangles into the DOM and keep a normal web experience. This means each side (rectangle) of the object is a simple DIV and could have any normal web content inside of it, and would work normally.
