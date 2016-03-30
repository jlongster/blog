"use strict";

require('babel-register');
const fs = require('fs');
const api = require('./server/impl/api2');
const csp = require('js-csp');
const moment = require('moment');

api.connect();

csp.go(function*() {
  const posts = yield api.db('zrevrange', api.dbkey('posts'), 0, -1);

  Promise.all(posts.map(k => {
    return api.getPost(k.replace('jlongster2::post::', ''));
  })).then(posts => {
    dump(posts);
  }).catch(err => console.log('ERROR', err));
});

function dump(posts) {
  posts.forEach(post => {
    post.date = moment.utc(post.date, "YYYYMMDD").format("MMMM D, YYYY");

    const blacklist = ['content', 'title', 'updatedDate', 'headerimgfull'];
    const meta = Object.keys(post).filter(x => blacklist.indexOf(x) === -1);
    let str = "---\n";

    meta.forEach(m => {
      str += m + ": " + JSON.stringify(post[m]) + "\n"
    });

    str += "---\n\n";
    str += "# " + post.title + "\n\n";
    str += post.content;

    fs.writeFileSync("posts/" + post.shorturl + ".md", str);
  });

  api.quit();
}
