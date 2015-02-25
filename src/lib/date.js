const moment = require("moment");

function displayDate(intDate) {
  return moment(intDate, 'YYYYMMDD').format('MMMM DD, YYYY');
}

function currentDate() {
  return parseInt(moment().format('YYYYMMDD'));
}

module.exports = { displayDate, currentDate };
