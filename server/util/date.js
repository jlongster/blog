const moment = require("moment");

function displayDate(intDate) {
  return moment.utc(intDate).format('MMMM DD, YYYY');
}

function currentDate() {
  return parseInt(moment().format('YYYYMMDD'));
}

module.exports = { displayDate, currentDate };
