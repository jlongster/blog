const ghm = require('./util/showdown-ghm.js');
const moment = require('moment');
const nconf = require('nconf');

function expandUrls(base, str) {
  base = base || '/';
  return str.replace(/(\s+(href|src)\s*=\s*["'])(\/[^"'>]*)/,
                     "$1" + base + "$3");
}

function escapeCDATA(str) {
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

  let utc = moment.utc(date);
  return utc.year() + '-'
    + pad(utc.month() + 1) + '-'
    + pad(utc.date()) + 'T'
    + pad(utc.hours()) + ':'
    + pad(utc.minutes()) + ':'
    + pad(utc.seconds()) + 'Z';
}

function render(nunjucksEnv, posts) {
  let base = nconf.get('url');

  posts = posts.map(post => {
    return Object.assign({}, post, {
      summary: ghm.parse(getParagraphs(post.content, 4)),
      content: escapeCDATA(expandUrls(base, ghm.parse(post.content))),
      date: dateToRFC3339(post.date)
    });
  });

  return nunjucksEnv.render('atom.xml', {
    base: nconf.get('url'),
    updated: dateToRFC3339(posts[0].date),
    author: 'James Long',
    posts: posts
  });
}

module.exports = { render };
