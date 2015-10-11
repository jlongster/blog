const constants = require('../constants');

function removeErrors(errors) {
  return {
    type: constants.REMOVE_ERRORS,
    errors: errors
  }
}

module.exports = { removeErrors };
