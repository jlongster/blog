var fs = require('fs');
var _ = require('transducers.js');
var moment = require('moment');
var api = require('impl/api');
var { go, chan, take, put, operations: ops } = require('js-csp');
var { slugify, invokeCallbackM, takeArray } = require('../src/lib/util');
var ipsum = fs.readFileSync(__dirname + '/ipsum.txt', 'utf8');
var len = ipsum.length;

api.connect(6379);

var posts = _.range(50).map(function(x) {
  var idx = Math.random() * (len - 500) | 0;
  var title = ipsum.slice(idx, idx + 30 + (Math.random() * 40 | 0));

  return {
    shorturl: slugify(title),
    content: ipsum.slice(idx),
    'abstract': ipsum.slice(idx + 20, idx + 300),
    title: title,
    published: 'y',
    tags: ['foo'],
    date: parseInt(moment().format('YYYYMMDD'))
  };
});

go(function*() {
  var client = api.getClient();
  var curPosts = yield take(invokeCallbackM(client,
                                            client.zrange,
                                            api.dbkey('posts'),
                                            0, -1));

  yield takeArray(curPosts.map(post => {
    return invokeCallbackM(client,
                           client.del,
                           api.dbkey('post', post));
  }));
  yield take(invokeCallbackM(client, client.del, api.dbkey('posts')))
  yield takeArray(posts.map(post => {
    return api.createPost(post.shorturl, post);
  }));
  console.log('done!');
  api.quit();
});
