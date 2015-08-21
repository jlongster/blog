const constants = require('../constants');
const Immutable = require('immutable');
const { toObj, map } = require('transducers.js');
const api = require('impl/api');
const { fields }  = require('../lib/redux');
const { go } = require('js-csp');
const globalActions = require('../globalActions');

const initialState = Immutable.fromJS({
  postsById: {},
  postsByQuery: {},
  postsByQueryName: {}
});

function update(state = initialState, action) {
  switch(action.type) {
  case constants.FETCH_POST:
    if(action.status === 'pump') {
      return state.updateIn(
        ['postsById'],
        p => p.set(action.id, action.value)
      );
    }
    break;
  case constants.QUERY_POSTS:
    if(action.status === 'pump') {
      return state.updateIn(
        ['postsByQueryName'],
        p => p.set(action.query.name, action.value)
      ).updateIn(
        ['postsByQuery'],
        // Note how we are using the literal query object as a key.
        // Reference equality FTW!
        q => q.set(Immutable.fromJS(action.query), action.value)
      );
    }
    break;
  }

  return state;
}

function getPost(id) {
  return (dispatch, getState) => {
    const state = getState();
    const posts = state.posts.get('postsById');

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
    if(!state.posts.getIn(['postsByQuery', Immutable.fromJS(query)])) {
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

function savePost(previousPost, post) {
  return dispatch => dispatch({
    type: constants.SAVE_POST,
    post: post,
    [fields.CHANNEL]: go(function*() {
      if(!previousPost.shorturl) {
        yield api.createPost(post.shorturl);
      }
      else if(previousPost.shorturl !== post.shorturl) {
        yield api.renamePost(previousPost.shorturl, post.shorturl);
      }

      yield api.updatePost(post.shorturl, post);

      if(previousPost.shorturl !== post.shorturl) {
        dispatch(globalActions.updatePath('/edit/' + post.shorturl));
      }
      else {
        dispatch(globalActions.updatePath('/' + post.shorturl));
      }
    }, { propagate: true })
  });
}

function deletePost(id) {
  return dispatch => dispatch({
    type: constants.DELETE_POST,
    id: id,
    [fields.CHANNEL]: go(function*() {
      yield api.deletePost(id);
      dispatch(globalActions.updatePath('/'));
    }, { propagate: true })
  });
}

module.exports = {
  update: update,
  actions: {
    getPost,
    queryPosts,
    queryDrafts,
    savePost,
    deletePost
  }
};
