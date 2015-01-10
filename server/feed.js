const handlebars = require('handlebars');
const statics = require('./impl/statics');
const t = require('transducers.js');
const { range, seq, compose, map, filter } = t;
const ghm = require('../src/lib/showdown-ghm.js');
const moment = require('moment');
const nconf = require('nconf');

const atomTemplate = handlebars.compile(statics.atomXML);

function expandUrls(base, str) {
  base = base || '/';
  return str.replace(/(\s+(href|src)\s*=\s*["'])(\/[^"'>]*)/,
                     "$1" + base + "$3");
}

function escapepCDATA(str) {
  return str.replace(/<!\[CDATA\[/, '&lt;![CDATA[')
    .replace(/\]\]>/, ']]&gt;');
}

function getParagraphs(str, num) {
  // num should be zero-based
  num--;

  // Don't split in the middle of a code block
  var safeLines =  str.split('```')[0].split('\n');
  var lines = [];
  var lastEmpty;
  var numPars = 0;

  // This is stupidly simple, just count the paragraphs by detecting
  // empty lines
  for(var i=0; i<safeLines.length; i++) {
    var line = safeLines[i];
    lines.push(line);

    if(line.match(/^\s*$/)) {
      if(numPars > num) {
        break;
      }

      numPars++;
    }
  }

  return lines.join('\n');
}

// For Atom Feeds
// http://tools.ietf.org/html/rfc3339
function dateToRFC3339(date) {
  function pad(n) {
    return n < 10 ? '0' + n : n;
  }

  let utc = moment(date, 'YYYYMMDD').utc();
  return utc.year() + '-'
    + pad(utc.month() + 1) + '-'
    + pad(utc.date()) + 'T'
    + pad(utc.hours()) + ':'
    + pad(utc.minutes()) + ':'
    + pad(utc.seconds()) + 'Z';
}

function render(posts) {
  let base = nconf.get('url');

  posts = map(posts, post => {
    post.summary = ghm.parse(getParagraphs(post.content, 4));
    post.content = escapepCDATA(expandUrls(base, ghm.parse(post.content)));
    post.date = dateToRFC3339(post.date);
    return post;
  });

  return atomTemplate({
    base: nconf.get('url'),
    updated: dateToRFC3339(posts[0].date),
    author: 'James Long',
    posts: posts
  });
}

module.exports = { render };
