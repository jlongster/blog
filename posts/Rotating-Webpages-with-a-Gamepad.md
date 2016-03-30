---
published: true
shorturl: "Rotating-Webpages-with-a-Gamepad"
tags: ["tech","gamepad"]
date: "December 29, 2011"
---

# Rotating Webpages with a Gamepad

Boy is it fun to have some time off. How else would I find time to implement this useless hack?

Firefox is currently implementing a [Gamepad API](https://wiki.mozilla.org/GamepadAPI) which will be awesome for games. This functionality isn't even in the nightlies yet, but it should be soon (I'm not sure what the roadmap is). There are [custom builds](http://people.mozilla.com/~tmielczarek/mouselock+gamepad/) though for you to start using it now (more details in this [hacks.mozilla.org post](http://hacks.mozilla.org/2011/12/paving-the-way-for-open-games-on-the-web-with-the-gamepad-and-mouse-lock-apis/)). People are starting to build [demos](http://rawkes.com/blog/2011/12/14/gamepad-api-demo-in-firefox-and-chrome) with it.

I got a Wii Classic Controller for Christmas and I knew had to do something. I hooked it into my computer and the demos worked instantly in Firefox. I settled on the following hack:

<iframe width="640" height="390" src="http://www.youtube.com/embed/YqLNEkjpuS0" frameborder="0" allowfullscreen="true"> </iframe>

It's a tiny amount of javascript that applies 3d [CSS transforms](https://developer.mozilla.org/en/CSS/transform) as the joystick moves around. It also zooms in and out as the second joystick moves. I only implemented it for Firefox; Chrome supports a similar API in their dev builds as well. (I will add Chrome support when it gets more mainstream.)

Here it is as a bookmarklet: <a style="display: inline-block; background-color: #F3F3F3; padding: 3px;" href="javascript:window.addEventListener(%22MozGamepadButtonDown%22%2Cfunction(a)%7Bconsole.log(%22down%22)%7D%2Cfalse)%3Bwindow.addEventListener(%22MozGamepadButtonUp%22%2Cfunction(a)%7Bconsole.log(%22up%22)%7D%2Cfalse)%3Bvar%20x_axis%3D0%3Bvar%20y_axis%3D0%3Bvar%20forward%3D1%3Bvar%20side%3D0%3Bwindow.addEventListener(%22MozGamepadAxisMove%22%2Cfunction(a)%7Bif(a.axis%3D%3D0)%7Bx_axis%3Da.value%7Delse%20if(a.axis%3D%3D1)%7By_axis%3Da.value%7Delse%20if(a.axis%3D%3D2)%7Bside%3Da.value%7Delse%20if(a.axis%3D%3D3)%7Bif(a.value%3C-.05)%7Bforward%3DMath.max(-a.value*5%2C1)%7Delse%20if(a.value%3E.05)%7Bforward%3D1-a.value%7Delse%7Bforward%3D1%7D%7Dvar%20b%3D%22rotate3d(1%2C%200%2C%200%2C%20%22%2BMath.floor(y_axis*90)%2B%22deg)%20%22%2B%22rotate3d(0%2C%201%2C%200%2C%20%22%2BMath.floor(x_axis*90)%2B%22deg)%20%22%2B%22scale3d(%22%2Bforward%2B%22%2C%22%2Bforward%2B%22%2C%22%2Bforward%2B%22)%22%3Bdocument.body.style.MozTransform%3Db%3Bdocument.body.style.MozTransformOrigin%3D%2250%25%200%22%7D%2Cfalse)">joystickify</a>

And here's the code. You can refer to the [Gamepad API](https://wiki.mozilla.org/GamepadAPI) wiki page for more info.

```javascript
var x_axis = 0;
var y_axis = 0;
var forward = 1.;

window.addEventListener("MozGamepadAxisMove", function(e) {
    if(e.axis == 0) {
        x_axis = e.value;
    }
    else if(e.axis == 1) {
        y_axis = e.value;
    }
    else if(e.axis == 3) {
        if(e.value < -.05) {
            forward = Math.max(-e.value*5, 1);
        }
        else if(e.value > .05) {
            forward = 1 - e.value;
        }
        else {
            forward = 1.;
        }
    }

    var transform = 'rotate3d(1, 0, 0, ' + Math.floor(y_axis*90) + 'deg) ' + 
        'rotate3d(0, 1, 0, ' + Math.floor(x_axis*90) + 'deg) ' +
        'scale3d(' + forward + ',' + forward + ',' + forward + ')';

    document.body.style.MozTransform = transform;
    document.body.style.MozTransformOrigin = '50% 0';
}, false);
```

[Discuss this on Hacker News](http://news.ycombinator.com/item?id=3404480)
