const csp = require('js-csp');
const { go, chan, take, put } = csp;
const _xhr = require('xhr');

function xhr(opts, ch) {
  ch = ch || chan();
  _xhr(opts, function(err, res, body) {
    let result = { raw: res, body: body };
    let value;

    if(err) {
      value = csp.Throw(err);
    }
    else if(res.statusCode !== 200) {
      value = csp.Throw(new Error(body));
    }
    else if(res.headers['content-type'].indexOf('application/json') !== -1) {
      result.json = JSON.parse(body) || false;
      value = result;
    }
    else {
      value = result;
    }

    csp.putAsync(ch, value, () => ch.close());
  });
  return ch;
}

module.exports = xhr;
