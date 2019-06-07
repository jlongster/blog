#!/usr/bin/env node
let fs = require('fs');

function parse(str) {
  let strLines = str.split('\n');
  let vertices = [];
  let lines = [];
  for (let i = 0; i < strLines.length; i++) {
    let text = strLines[i];
    let elements = text.split(/\s+/);

    switch (text[0]) {
      case 'v':
        vertices.push([
          parseFloat(elements[1]),
          parseFloat(elements[2]),
          parseFloat(elements[3])
        ]);
        break;
      case 'l':
        let from = parseInt(elements[1]);
        let to = parseInt(elements[2]);
        lines.push([vertices[from - 1], vertices[to - 1]]);
        break;
    }
  }
  return lines;
}

let str = fs.readFileSync(process.argv[2], 'utf8');
console.log(JSON.stringify(parse(str)));
