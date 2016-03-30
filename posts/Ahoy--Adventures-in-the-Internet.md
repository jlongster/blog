---
published: true
shorturl: "Ahoy--Adventures-in-the-Internet"
tags: ["html","css"]
date: "July 17, 2012"
---

# Ahoy: Adventures in the Internet with real-time HTML/CSS editing

I've been working on a real-time collaborative HTML/CSS editor powered by <a href="http://sharejs.org/">sharejs</a>. Although it's just a prototype and very rough, I threw it on my server and <a href="http://news.ycombinator.com/item?id=4252561">posted it to HN</a> and tweeted it.

It's called <a href="http://jlongster.com:4007/">Ahoy</a>!

> "Wooooow, it took me about 2 seconds to go from this is kinda cool I wonder how its built to giggling and spamming "P*NIS". This is the best!" - zaptheimpaler

> "I would just like to thank the utter MORON who put the infinite while loop alert box. No option to close it, can't switch to other tabs. I had to restart a 4 hour download thanks to you." - Xcelerate

This was a fascinating experiment to see how people reacted to coding in a chat room. It wasn't meant to be a chat room, but that's basically what ended up happening. It was etherpad married to jsfiddle with a little bit of IRC. Yes, I apologize for the lack of input scrubbing, allowing script kiddies to spam you with alerts. Firefox (and I think Chrome) allows you to suppress all alerts from a page, so I didn't worry too much about it.

[![hello](/img/ahoy-thumbs/ahoy5.png)](/img/ahoy/ahoy5.png)

I didn't worry about scrubbing scripts out because I can never fill all the holes. The security problems aren't as bad as you think because there's nothing an attacker could gain from running scripts in your browser (thanks to cross-domain security). However, I quickly saw that people could paste huge amounts of content to grind your browser to a halt. There's also potential malicious behavior with iframes and CSRF.

In a reaction to what I saw unfolding before my eyes, I patched the code to scrub out most of the malicious code. Thanks to my coworker <a href="http://twitter.com/potch">@potch</a>, a small amount of DOM replacing removes all the script tags, iframes, and a few other things. This solved most of the problems.

I learned a lot from this experience. The initial crowd was fun and lots of people were hacking cool CSS ideas together. However, as it caught on the audience went from techie to asshole, with people deleting all the code every few seconds, injecting javascript in creative ways to spam you with alerts, and even injecting porn. Once this started happening, the HN community created the <a href="http://jlongster.com:4007/noassholes">noassholes</a> pad so that we could hack in peace.

Eventually, that got taken over too. It seemed to be catching on in the 4chan world.

This has forever proved the <a href="http://www.penny-arcade.com/comic/2004/03/19/">"Dickwad Theory"</a>.

When you join Ahoy, you are thrown into a global pad by default. I had to create 8 new global pads because they kept devolving into disgusting, hack-ridden pools of code. Yikes.

In the end, this was really fun though. There were some great interactions as the community tried to lay out rules such as "Do no erase all the code at once", after which somebody does just that (luckily Cmd+Z brings it right back). It's also interesting that I could get instant feedback because I was connected to my users that could talk to me.

This was also great for learning vulnerabilities on the web. You could literally watch people try to inject javascript and come up with creative ways to get around my scrubbing. Here are some of my favorites:

```
<img src="sfsdf.png" onerror=alert('no you dont')">
<img src="sfsdf.png" onerror=document.body.innerHTML=''">
<sc<scriptript>window.location=google.com"</script>
<meta http-equiv="refresh" content=0;url=http://jlongster:4007/" /> 
```

The meta redirect was interesting. What Ahoy does is it sets the HTML of a DOM element to your code. So the meta redirect is within the `<body>` tag, so it doesn't work on Firefox. But it does work on Chrome!

Once I plugged the main holes, the script kiddies seem to go away. A few people are still using it right now, but in general most of the attention has died off. Thanks for the great fun and helping me learn how to make interactive products!

Click on the screenshots below to see what it looked like.

_Discuss on <a href="https://news.ycombinator.com/item?id=4267874">Hacker News</a>_

[![ahoy1](/img/ahoy-thumbs/ahoy1.png)](/img/ahoy/ahoy1.png)

[![ahoy2](/img/ahoy-thumbs/ahoy2.png)](/img/ahoy/ahoy2.png)

[![ahoy3](/img/ahoy-thumbs/ahoy3.png)](/img/ahoy/ahoy3.png)

[![ahoy4](/img/ahoy-thumbs/ahoy4.png)](/img/ahoy/ahoy4.png)

[![ahoy5](/img/ahoy-thumbs/ahoy5.png)](/img/ahoy/ahoy5.png)

[![ahoy6](/img/ahoy-thumbs/ahoy6.png)](/img/ahoy/ahoy6.png)

[![ahoy7](/img/ahoy-thumbs/ahoy7.png)](/img/ahoy/ahoy7.png)
