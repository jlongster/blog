const moment = require('moment');
const React = require('react');
const path = require('path');

// Util

function forcefulDate(date) {
  if(typeof date == 'number') {
    date = intToDate(date);
  }
  else if(typeof date == 'string') {
    date = intToDate(parseInt(date));
  }
  else {
    date = moment();
  }

  return date;
}

function formatDate(date, format) {
  return forcefulDate(date).format(format || 'MMMM DD YYYY');
}

function dateToInt(date) {
  return parseInt(forcefulDate(date).format('YYYYMMDD'));
}

function intToDate(x) {
  return moment(x.toString(), 'YYYYMMDD');
}

function previousDates() {
  var current = moment();
  var end = moment().subtract('years', 2);
  var dates = [];

  while(current > end) {
    dates.push(dateToInt(current));
    current = current.subtract('days', 1);
  }

  return dates;
}

function rootUrl(req, port, noPort) {
  // For some reason req doesn't have the port
  var base = req.protocol + '://' + req.host;

  if(!noPort && port != 80) {
    base += ':' + port;
  }

  return base;
}

function tmpFile() {
  // TODO: use a proper tmp file lib
  return 'blogthing-' + Math.floor(Math.random()*10000) + Date.now();
}

function slugify(name) {
  return name.replace(/[ \n!@#$%^&*():"'|?=]/g, '-');
}

function handleError(err, next) {
  if(err) {
    if(next) {
      next(err);
    }
    else {
      console.error(err);
    }
  }

  return err;
}

function base32(input) {
  var chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  var res = [];

  while(input != 0) {
    res.push(chars[input % 36]);
    input = input / 36 | 0;
  }

  return res.join('');
}

function relativePath(p) {
  // We are actually running in the .built directory which adds a
  // level of nesting
  return path.join(__dirname + '/..', p);
}

module.exports = {
  formatDate,
  dateToInt,
  intToDate,
  previousDates,
  rootUrl,
  tmpFile,
  slugify,
  handleError,
  base32,
  relativePath
};
