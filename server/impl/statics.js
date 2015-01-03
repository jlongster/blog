const fs = require('fs');
const path = require('path');

function read(filename) {
  return fs.readFileSync(path.join(__dirname, '/../../', filename),
                         'utf8');
}

const statics = {
  baseHTML: read('static/template.html'),
  projectsHTML: read('static/projects.html'),
  socialHTML: read('static/social.html'),
  commentsHTML: read('static/comments.html'),
  atomXML: read('static/atom-tmpl.xml')
};

module.exports = statics;
