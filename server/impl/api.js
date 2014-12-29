const redis = require('redis');
const nconf = require('nconf');
const csp = require('src/lib/csp');
const { go, chan, take, put, operations: ops } = csp;
const {
  invokeCallback, invokeCallbackM, takeAll
} = require("src/lib/chan-util");
const t = require("transducers.js");
const { map, filter } = t;
const { toObj } = t;
const { dateToInt } = require('../util');

let client;

function connect(port, host) {
  client = redis.createClient(port || nconf.get('redis:port'),
                              host || nconf.get('redis:host'));
  client.on('error', function(err) {
    console.log('error: ' + err);
  });
}

function quit() {
  client.quit();
  client = null;
}

function db(method /*, args... */) {
  var args = Array.prototype.slice.call(arguments, 1);
  args.unshift(client[method]);
  args.unshift(client);
  return invokeCallbackM.apply(null, args);
}

function dbkey() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift('jlongster2');
    return args.join('::');
}

function dbSplitKey(key) {
    return key.split('::');
}

let postFields = [
  'shorturl',
  'title',
  'abstract',
  'content',
  'date',
  'published',
  'tags',
  'headerimg',
  'headerimgfull',
  'readnext'
];

// db representation -> JSON type
function _normalizePost(post) {
  post = toObj(post);
  if(post.tags) {
    post.tags = post.tags.split(',');
  }
  if(post.date) {
    post.date = parseInt(post.date);
  }
  if(post.published) {
    post.published = post.published === 'y';
  }
  if(post.headerimgfull) {
    post.headerimgfull = post.headerimgfull === 'y';
  }
  return post;
}

// JSON type -> db representation
function _denormalizePost(post) {
  // Only use the whitelisted fields
  post = toObj(postFields, t.compose(
    t.map(x => post[x] !== undefined ? [x, post[x]] : null),
    t.filter(x => x)
  ));

  if(post.tags) {
    post.tags = filter(map(post.tags, x => x.trim().replace(/ /g, '-')),
                       x => x.length).join(',');
  }
  if(post.date) {
    post.date = dateToInt(post.date).toString();
  }
  if(post.published !== undefined) {
    post.published = post.published ? 'y' : 'n';
  }
  if(post.headerimgfull !== undefined) {
    post.headerimgfull = post.headerimgfull ? 'y' : 'n';
  }
  return post;
}

function _getPost(key) {
  let ch = chan();
  go(function*() {
    let post = yield db('hgetall', key);
    yield put(ch, csp.Throw(new Error('uh oh')));
    if(post) {
      yield put(ch, _normalizePost(post));
    }
    ch.close();
  }, { propagate: true });
  return ch;
}

function _getPosts(keys) {
  let ch = chan();
  go(function*() {
    for(let i in keys) {
      let post = yield _getPost(keys[i]);
      if(!post) {
        throw new Error('cannot find post: ' + keys[i]);
      }
      else if(!yield put(ch, post)) {
        break;
      }
    }
    ch.close();
  });
  return ch;
}

function _runQuery(opts) {
  opts = opts || {};
  let query = [];
  if(opts.filter) {
    for(let name in opts.filter) {
      query.push(t.filter(x => {
        if(x[name].length) {
          return x[name].indexOf(opts.filter[name]) !== -1;
        }
        return x[name] === opts.filter[name];
      }));
    }
  }
  if(opts.select) {
    query.push(t.map(x => {
      return t.toObj(opts.select, t.map(name => [name, x[name]]));
    }));
  }
  if(opts.limit) {
    query.push(t.take(opts.limit));
  }

  var ch = chan(1, query.length ? t.compose.apply(null, query) : null);
  go(function*() {
    var keys = yield db('zrevrange', dbkey('posts'), 0, -1);
    ops.pipe(_getPosts(keys), ch);
  }, { propagate: true });

  return takeAll(ch);
}

// public API

function getPosts(limit) {
  return queryPosts({ limit: limit,
                      filter: { published: true }})
}

function queryDrafts(query) {
  query.filter = t.merge(query.filter || {}, { published: false });
  return _runQuery(query);
}

function queryPosts(query) {
  query.filter = t.merge(query.filter || {}, { published: true });
  return _runQuery(query);
}

function getPost(shorturl) {
  return _getPost(dbkey('post', shorturl));
}

function savePost(post) {
  return go(function*() {
    let originalUrl = post.originalUrl;
    post = _denormalizePost(post);

    if(post.shorturl === 'new') {
      return csp.Throw(new Error('the url `new` is reserved'));
    }
    else if(originalUrl && originalUrl !== post.shorturl) {
      // Attempt a url rename. This should only be possible on
      // non-published posts, so we need to pull down the post from
      // the db to check that
      let savedPost = yield getPost(originalUrl);
      if(!savedPost.published) {
        let originalKey = dbkey('post', originalUrl);
        let key = dbkey('post', post.shorturl);

        yield db('rename', originalKey, key);
        yield db('zrem', dbkey('posts'), originalKey);
        yield db('zadd', dbkey('posts'), post.date, key);
      }
      else {
        return csp.Throw(new Error('cannot change the url of a published post'));
      }
    }

    let key = dbkey('post', post.shorturl);
    if(!originalUrl && yield db('exists', key)) {
      // error, a new post cannot overwrite an existing post
      return csp.Throw(new Error('post already exists with url: ' + post.shorturl));
    }
    else {
      yield db('hmset', key, post);
    }

    // Make sure the index is up-to-date
    if(post.date) {
      yield db('zadd', dbkey('posts'), post.date, key);
    }

    // TODO: updatedDate
  }, { propagate: true });
}

function deletePost(shorturl) {
  // Note: we don't literally remove the post in case you want to
  // recover it. We have plenty of memory, but in the future we could
  // add an option to remove it completely.
  return db('zrem', dbkey('posts'), dbkey('post', shorturl));
}

module.exports = {
  connect: connect,
  quit: quit,
  getPost: getPost,
  getPosts: getPosts,
  queryPosts: queryPosts,
  queryDrafts: queryDrafts,
  savePost: savePost,
  deletePost: deletePost,
  dbkey: dbkey,
  getClient: function() {
    return client;
  }
};
