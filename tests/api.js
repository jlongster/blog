const assert = require('assert');
const csp = require('src/lib/csp');
const { go, chan, take, put, operations: ops } = csp;
const api = require('../impl/api');

api.connect(6379, '127.0.0.1');

function assertThrow(c) {
  return go(function*() {
    let good, bad;
    try {
      good = yield take(c);
    }
    catch(e) {
      bad = e;
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

  it('should be empty', function(done) {
    go(function*() {
      let post = yield api.getPost('testing');
      assert.strictEqual(post, null);
      assert.strictEqual((yield api.getPosts(10)).length, 0);
      done();
    });
  });

  it('should save a post', function(done) {
    go(function*() {
      let post, err;
      yield assertThrow(api.savePost({}));
      yield assertThrow(api.savePost({ shorturl: 'new' }));
      yield api.savePost({
        shorturl: 'testing'
      });

      let post = yield api.getPost('testing');
      assert.deepEqual(post, { shorturl: 'testing' });

      // You can't save over an existing post
      yield assertThrow(api.savePost({
        shorturl: 'testing',
        content: 'foo'
      }));

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
      assert.deepEqual(post, {
        shorturl: 'testing',
        content: 'foo'
      });

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
    done();
  });
});
