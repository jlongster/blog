const redux = require('./redux');
const ReactInstanceMap = require('react/lib/ReactInstanceMap');

function getIdFromInstance(instance) {
  const internalInstance = ReactInstanceMap.get(instance);
  return internalInstance ? internalInstance._rootNodeID : null;
}

function allocate(store, id, initialState) {
  const atomState = store.getState();
  if(!atomState.__localState) {
    throw new Error('no place to put local state, your app state needs' +
                    'a __localState store/reducer/whatever');
  }

  if(!atomState.__localState[id]) {
    atomState.__localState[id] = initialState;
    return initialState;
  }
  return atomState.__localState[id];
}

function deallocate(store, id) {
  store.getState().__localState[id] = null;
}

function set(store, id, state) {
  allocate(store, id, state);
  store.getState().__localState[id] = state;
}

function get(store, id) {
  return store.getState().__localState[id];
}

function withLocalState(componentClass) {
  componentClass.contextTypes = {
    store: redux.storeShape.isRequired
  }

  const prevWillMount = componentClass.prototype.componentWillMount;
  componentClass.prototype.componentWillMount = function() {
    let id = getIdFromInstance(this);
    let state = allocate(this.context.store, id, this._initialState);

    if(state !== this.state) {
      // Force an immediate state injection (probably a better way to
      // do this)
      this.state = state;
    }

    if(prevWillMount) {
      prevWillMount.call(this);
    }
  };

  const prevWillUnmount = componentClass.prototype.componentWillUnmount;
  componentClass.prototype.componentWillUnmount = function() {
    let id = getIdFromInstance(this);
    deallocate(this.context.store, id);

    if(prevWillUnmount) {
      prevWillUnmount.call(this);
    }
  };

  Object.defineProperty(componentClass.prototype, "state", {
    get: function() {
      let id = getIdFromInstance(this);
      if(id) {
        return get(this.context.store, id);
      }
      return this._initialState;
    },

    set: function(state) {
      let id = getIdFromInstance(this);
      if(id) {
        set(this.context.store, id, state);
      }
      else {
        this._initialState = state;
      }
    }
  });

  return componentClass;
}

module.exports = withLocalState;
