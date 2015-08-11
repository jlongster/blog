const redis = require('redis');
const nconf = require('nconf');
const csp = require('js-csp');
const { go, chan, take, put, operations: ops } = csp;
const {
  invokeCallback, invokeCallbackM, takeAll
} = require("../../src/lib/util");
const t = require("transducers.js");
const { map, filter } = t;
const { toObj } = t;
const { currentDate } = require('../../src/lib/date');

let client;

function connect(port, host) {
  if(!client) {
    client = redis.createClient(port || nconf.get('redis:port') || 6379,
                                host || nconf.get('redis:host'));
    client.on('error', function(err) {
      console.log('error: ' + err);
    });
  }
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
  'readnext',
  'assets'
];

// db representation -> JSON type
function _normalizePost(post) {
  post = toObj(post);
  if(typeof post.tags === 'string') {
    post.tags = post.tags === '' ? [] : post.tags.split(',');
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
    post.date = post.date.toString();
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
    let post = yield take(db('hgetall', key));
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
      else if(!(yield put(ch, post))) {
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
        if(x[name] && x[name].length) {
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

function _finalizeEdit(key, date) {
  return go(function*() {
    if(date) {
      yield db('zadd', dbkey('posts'), date, key);
    }

    // Make sure it persists to disk
    client.save();
  });
}

// public API

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

function createPost(shorturl, props = {}) {
  props = _denormalizePost(t.merge({
    date: currentDate(),
    tags: '',
    published: false
  }, props));
  props.shorturl = shorturl;

  return go(function*() {
    if(shorturl === 'new') {
      return csp.Throw(new Error('the url `new` is reserved'));
    }

    let key = dbkey('post', shorturl);
    if(yield db('exists', key)) {
      // A new post cannot overwrite an existing post
      return csp.Throw(new Error('post already exists with url: ' + props.shorturl));
    }
    else {
      yield db('hmset', key, props);
    }

    yield _finalizeEdit(key, props.date);
  }, { propagate: true });
}

function renamePost(shorturl, newurl) {
  return go(function*() {
    if(newurl === 'new') {
      return csp.Throw(new Error('the url `new` is reserved'));
    }
    else if(newurl === shorturl) {
      return csp.Throw(new Error('renamed to the same url: ' + shorturl));
    }

    // Attempt a url rename. This should only be possible on
    // non-published posts, so we need to pull down the post from
    // the db to check that
    let savedPost = yield getPost(shorturl);
    if(!savedPost) {
      return csp.Throw(new Error('post does not exist: ' + shorturl));
    }
    else if(!savedPost.published) {
      let savedKey = dbkey('post', shorturl);
      let key = dbkey('post', newurl);

      yield db('rename', savedKey, key);
      yield db('hmset', key, { shorturl: newurl });
      yield db('zrem', dbkey('posts'), savedKey);
      _finalizeEdit(key, savedPost.date);
    }
    else {
      return csp.Throw(new Error('cannot change the url of a published post'));
    }
  }, { propagate: true });
}

function updatePost(shorturl, props) {
  return go(function*() {
    props = _denormalizePost(props);
    delete props.shorturl;
    let key = dbkey('post', shorturl);

    if(!(yield db('exists', key))) {
      return csp.Throw(new Error('post does not exist: ' + shorturl));
    }

    yield db('hmset', key, props);

    _finalizeEdit(key, props.date);
  }, { propagate: true });
}

function deletePost(shorturl) {
  return go(function*() {
    let key = dbkey('post', shorturl);

    // Note: we don't literally remove the post in case you want to
    // recover it. We have plenty of memory, but in the future we could
    // add an option to remove it completely.
    yield db('zrem', dbkey('posts'), dbkey('post', shorturl));
  });
}

function __eval() {
  // Playing with my blog API
  // go(function*() {
  //   console.log(yield queryPosts({
  //     select: ['title', 'date'],
  //     limit: 2
  //   }));
  // });
}

module.exports = {
  connect: connect,
  quit: quit,
  getPost: getPost,
  queryPosts: queryPosts,
  queryDrafts: queryDrafts,
  createPost: createPost,
  renamePost: renamePost,
  updatePost: updatePost,
  deletePost: deletePost,
  db: db,
  dbkey: dbkey,
  getClient: function() {
    return client;
  }
};

if(module.hot) {
  if(module.hot.data) {
    client = module.hot.data.client;
  }

  module.hot.dispose(function(data) {
    data.client = client;
  });
}
