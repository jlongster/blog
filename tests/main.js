const expect = require('expect.js');
const nconf = require('nconf');
const request = require('request');
// const csp = require('src/lib/csp');
// const { go, chan, take, put, ops } = csp;

const url = 'http://localhost:4000';

describe('jlongster', function() {
  it('should work', function(done) {
    request('http://localhost:4000/', function(err, res, body) {
      expect(body).to.match(/Drafts/);
      done();
    });
  });
});
