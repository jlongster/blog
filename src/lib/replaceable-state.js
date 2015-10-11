
const REPLACE_STATE = "@@dispatch/replace-state";
function replaceable(reducer) {
  return (state, action) => {
    if(action.type === REPLACE_STATE) {
      return action.state;
    }
    return reducer(state, action);
  }
}

module.exports = {
  replaceable,
  REPLACE_STATE
}
