const constants = require('../constants');
const { mergeObj } = require('../lib/util');

function updateUser(user) {
  return {
    type: constants.UPDATE_USER,
    user: user
  };
}

function updatePageTitle(title) {
  return {
    type: constants.UPDATE_PAGE_TITLE,
    title: title
  }
}

function updateErrorStatus(status) {
  return {
    type: constants.UPDATE_ERROR_STATUS,
    status: status
  }
}

module.exports = {
  updateUser,
  updatePageTitle,
  updateErrorStatus
};
