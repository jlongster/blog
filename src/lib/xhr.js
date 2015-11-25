const csp = require('js-csp');
const { go, chan, take, put } = csp;
const _xhr = require('xhr');

function xhr(optsOrURL, ch) {
  let opts = optsOrURL;
  if(typeof opts === "string") {
    opts = { url: optsOrURL };
  }

  return new Promise(function(resolve, reject) {
    _xhr(opts, function(err, res, body) {
      let result = { raw: res, body: body };
      let value;

      if(err) {
        reject(err);
      }
      else if(res.statusCode === 500) {
        reject(new Error(body));
      }
      else if(res.headers['content-type'].indexOf('application/json') !== -1) {
        result.json = JSON.parse(body) || false;
        resolve(result);
      }
      else {
        resolve(result);
      }
    });
  });
}

module.exports = xhr;
