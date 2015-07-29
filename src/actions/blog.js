const constants = require('../constants');
const xhr = require('../lib/xhr');
const { fields } = require('../lib/redux');
const api = require("impl/api");
const Immutable = require("immutable");
const { mergeObj } = require('../lib/util');

function updatePage(opts) {
  return mergeObj(opts, {
    type: constants.UPDATE_PAGE
  });
}

function updateRoute(path, user) {
  return {
    type: constants.UPDATE_ROUTE,
    path: path,
    user: user
  };
}

function getPost(id) {
  return (dispatch, getState) => {
    const state = getState();
    const posts = state.getIn(['posts', 'postsById']);

    if(!posts.find(post => post.shorturl === id)) {
      return dispatch({
        type: constants.FETCH_POST,
        id: id,
        [fields.CHANNEL]: api.getPost(id)
      });
    }
  };
}

function _query(query, runQuery) {
  return (dispatch, getState) => {
    const state = getState();

    // If the query already exists in the cache, don't bother
    // re-querying it
    if(!state.getIn(['posts', 'postsByQuery', Immutable.fromJS(query)])) {
      return dispatch({
        type: constants.QUERY_POSTS,
        query: query,
        [fields.CHANNEL]: runQuery(query)
      });
    }
  }
}

function queryPosts(query) {
  return _query(query, api.queryPosts);
}

function queryDrafts(query) {
  return _query(query, api.queryDrafts);
}

module.exports = {
  updatePage,
  updateRoute,
  getPost,
  queryPosts,
  queryDrafts
};
