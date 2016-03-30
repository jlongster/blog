---
shorturl: "Modularity"
tags: ["modules"]
published: true
date: "January 8, 2015"
readnext: "My-2014-Retrospective"
abstract: "Recently there's been some heated discussion over writing modular code, what that means, and which style is better. In this article I reflect on the discussion and about respecting each other."
---

# Modularity

Recently there's been some heated discussion over writing modular code, what that means, and which style is better. A gist about [browserify vs webpack](https://gist.github.com/substack/68f8d502be42d5cd4942) started the discussion and it's evolved in the comments and on twitter since then.

It's hard to talk about this because "modularity" is such an abstract concept. I actually think people commenting on that gist did a good job directing the conversation to defining what they mean by "modular". Even so, it's hard to give a strong argument for something so abstract. It's similar to debating the classic performance vs. memory tradeoff in software, and making arguments for why you should always skew towards better performance. It's more of a tradeoff and less of a right/wrong answer.

But people have strong opinions about this because *modules are how we interact with each other*. We're talking about interfaces, about how to share code. And that's something that needs a certain level of social agreement to work, so it makes sense that people are trying to engage others about it. It's not a zero-sum game, but the more we agree on how to write modules, the more code we can all use.

Still, there's certainly a continuum of preferences. On one side, Ember chooses to package everything up into a single thing that you download and immediately get running. On the other hand, [substack](https://twitter.com/substack) and [Raynos](https://twitter.com/Raynos) believe in publishing tiny single-focus modules that do one thing well, and guiding the developer in how to package it all up.

Who's right? Both of them. Although it's important that we have a certain level of social agreement on how to write modules, this is *not* a zero-sum game and both styles can co-exist. Although there are technical arguments for each side, I think a lot of it just has to do with personality as well. Some people like big frameworks. Some people like putting tiny pieces together. The important part is that we treat each other with respect.

The tiny module approach is certainly extreme, to the point where you publish almost every single function as a module. Personally I believe at this level you incur too much churn with just managing all your libraries. Tracking issues on multiple separate repos is good in some cases, in many others its a time suck without much gain.

On the other hand, 2 days ago I was glad to find a library `debounce` on npm, which does exactly that: provides a single `debounce` function. In some cases, it works, in many others, it doesn't.

I've seen aggresive critiques of code that don't follow this tiny module pattern, though, which Pete Hunt in [this comment](https://gist.github.com/substack/68f8d502be42d5cd4942#comment-1365101) coins as "Module Shaming". It's certainly a real thing in the JS world and I would appreciate it if we would stop it.

Just remember this is a virtual world that we all made up with arbitrary rules. The most important thing is to treat each other with respect.

* A final note: I was struck by the contrast between the gist comments and twitter comments. While the gist is heated, except for a few comments it's relatively on track and doesn't attack people specifically. Twitter quickly devolved into personal attack (it was tempting for me as well). It feels like there's something fundamentally wrong with 140 chars.
* If you want to look into the twitter conversation, check out [my tweets](https://twitter.com/jlongster) and you can probably walk backwards from there. It's hard to track twitter so isn't a single starting point.




