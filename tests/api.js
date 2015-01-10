const assert = require('assert');
const csp = require('src/lib/csp');
const { go, chan, take, put, operations: ops } = csp;
const api = require('../impl/api');

api.connect(6379, '127.0.0.1');

function assertThrow(c, matchStr) {
  return go(function*() {
    let good, bad;
    try {
      good = yield take(c);
    }
    catch(e) {
      bad = e;
      if(matchStr) {
        assert.ok(e.toString().toLowerCase().indexOf(matchStr) !== -1);
      }
    }
    assert.strictEqual(good, undefined);
    assert.ok(bad);
  });
}

describe('api', function() {
  before(function() {
    go(function*() {
      yield api.db('select', 1);
      yield api.db('flushdb');
    });
  });

  it('should not have posts', function(done) {
    go(function*() {
      let post = yield api.getPost('testing');
      assert.strictEqual(post, null);
      assert.strictEqual((yield api.getPosts(10)).length, 0);
      done();
    });
  });

  it('should create a post', function(done) {
    go(function*() {
      let post, err;
      // 'new' is resevered, it's a special url
      yield assertThrow(api.createPost('new'));

      // Create an empty post
      yield api.createPost('testing');
      let post = yield api.getPost('testing');
      assert.equal(post.shorturl, 'testing');
      assert.strictEqual(post.published, false);
      assert.deepEqual(post.tags, []);

      // You can't save over an existing post
      yield assertThrow(api.createPost('testing'));

      // Create a post with initial properties
      yield api.createPost('testing2', {
        content: 'foo',
        date: 19840620,
        tags: ['one', 'two'],
        published: true
      });

      post = yield api.getPost('testing2');
      assert.deepEqual(post, {
        shorturl: 'testing2',
        content: 'foo',
        date: 19840620,
        tags: ['one', 'two'],
        published: true
      });

      // Make sure it's in the index
      let rank = yield api.db('zrank',
                              api.dbkey('posts'),
                              api.dbkey('post', 'testing'));
      assert.ok(rank !== null);

      done();
    });
  });

  it('should update a post', function(done) {
    go(function*() {
      yield assertThrow(api.updatePost('non-existant', {}));
      yield api.updatePost('testing', {
        content: 'foo'
      });

      let post = yield api.getPost('testing');
      assert.equal(post.shorturl, 'testing');
      assert.equal(post.content, 'foo');

      // Make sure all the fields are correctly marshalled through the
      // db and back again, and the whitelist ignores unknown fields
      yield api.updatePost('testing', {
        abstract: 'a thing happened',
        content: 'wow!',
        date: 20140620,
        tags: ['one', 'two'],
        published: true,
        headerimgfull: false,
        badField: 'yes'
      });

      post = yield api.getPost('testing');

      // badField is missing now and the fields have maintained integrity
      assert.deepEqual(post, {
        shorturl: 'testing',
        abstract: 'a thing happened',
        content: 'wow!',
        date: 20140620,
        tags: ['one', 'two'],
        published: true,
        headerimgfull: false
      });

      done();
    });
  });

  it('should rename a post', function(done) {
    go(function*() {
      // The url 'new' is reserved
      yield assertThrow(api.renamePost('testing', 'new'), 'reserved');
      // Invalid to rename to the same name
      yield assertThrow(api.renamePost('testing', 'testing'), 'same');
      // Cannot rename a published post
      yield assertThrow(api.renamePost('testing', 'testing-new'), 'published');

      yield api.updatePost('testing', { published: false });
      let post = yield api.getPost('testing');
      yield api.renamePost('testing', 'testing-new');
      let renamedPost = yield api.getPost('testing-new');
      assert.equal(renamedPost.shorturl, 'testing-new');
      delete renamedPost.shorturl;
      delete post.shorturl;
      assert.deepEqual(post, renamedPost);

      yield api.renamePost('testing-new', 'testing');
      done();
    });
  });

  it('should delete a post', function(done) {
    go(function*() {
      yield api.deletePost('testing');

      // Right now, deleting a post does not literally remove it, so it
      // should still exist
      let post = yield api.getPost('testing');
      assert.ok(post);

      // But it should be gone from the index
      let rank = yield api.db('zrank',
                              api.dbkey('posts'),
                              api.dbkey('post', post.shorturl));
      assert.ok(rank === null);
      done();
    });
  });

  it('should get posts', function(done) {
    go(function*() {
      yield api.db('flushdb');
      yield api.createPost('foo');
      yield api.createPost('bar');
      yield api.createPost('baz');

      // None of them are published yet, so should get 0
      assert.equal((yield api.getPosts(10)).length, 0);

      yield api.updatePost('foo', { published: true });
      yield api.updatePost('bar', { published: true });
      yield api.updatePost('baz', { published: true });

      assert.equal((yield api.getPosts(10)).length, 3);
      assert.equal((yield api.getPosts(2)).length, 2);

      done();
    });
  });

  function populate() {
    return go(function*() {
      yield api.db('flushdb');
      yield api.createPost('foo');
      yield api.createPost('bar', {
        tags: ['srsly']
      });
      yield api.createPost('baz', {
        tags: ['srsly']
      });
      yield api.createPost('biz', { published: true });
    });
  }

  it('should query posts', function(done) {
    go(function*() {
      yield populate();

      // `queryPosts` never returns unpublished posts
      let posts = yield api.queryPosts({});
      assert.equal(posts.length, 1);
      assert.equal(posts[0].shorturl, 'biz');
      assert.equal((yield api.queryPosts({
        filter: { tags: 'srsly' }
      })).length, 0);

      done();
    });
  });

  it('should query drafts', function(done) {
    go(function*() {
      yield populate();

      // `queryDrafts` only queries unpublished posts
      assert.equal((yield api.queryDrafts({})).length, 3);

      let posts = yield api.queryDrafts({
        filter: { tags: 'srsly' }
      });
      assert.equal(posts.length, 2);
      assert.ok(['bar', 'baz'].indexOf(posts[0].shorturl) !== -1);
      assert.ok(['bar', 'baz'].indexOf(posts[1].shorturl) !== -1);
      done();
    });
  });
});
