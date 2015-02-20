const fs = require('fs');
const path = require('path');
const relativePath = require('../relative-path');

function read(filename) {
  return fs.readFileSync(path.join(relativePath('../'), filename),
                         'utf8');
}

const statics = {
  baseHTML: read('static/template.html'),
  projectsHTML: read('static/projects.html'),
  socialHTML: read('static/social.html'),
  atomXML: read('static/atom-tmpl.xml')
};

module.exports = statics;
