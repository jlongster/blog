
function renamePost(post, newKey) {
  return promise(function*() {
    var key = dbkey('post', post.shorturl);
    var multi = client.multi();

    multi.rename(key, newKey)
      .zrem(dbkey('posts'), key)
      .zadd(dbkey('posts'), post.date, newKey);

    post.tags.forEach(function(tag) {
      multi.zrem(dbkey('tag', tag), key)
        .zadd(dbkey('tag', tag), post.date, newKey);
    });

    return yield take(invokeCallbackM(multi, multi.exec));
  });
}

function savePost(post) {
  return promise(function*() {
    post = toObj(post);
    post.tags = post.tags.join(',');
    var key = dbkey('post', post.shorturl);

    yield take(db('hmset', key, post));
    yield take(db('zadd', dbkey('posts'), dateToInt(post.date), key));
  });
}

function getUser(email) {
  return promise(function*() {
    var user = yield take(db('hgetall', dbkey('user', email)));
    if(user) {
      user.admin = user.admin === 'y';
    }
    return user;
  });
}

function saveUser(user) {
  return promise(function*() {
    user.admin = user.admin ? 'y' : 'n';
    return yield take(db('hmset', dbkey('user', user.email)));
  });
}

function saveAutosave(shorturl, content) {
  return promise(function*() {
    yield take(db('set', 'autosave-' + shorturl));
  });
}

function getAutosave(shorturl) {
  return promise(function*() {
    yield take(db('get', 'autosave-' + shorturl));
  });
}

function removeAutosave(shorturl) {
  return promise(function*() {
    yield take(db('del', 'autosave-' + shorturl));
  });
}
