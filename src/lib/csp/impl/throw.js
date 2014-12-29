function Throw(e) {
  if (!(this instanceof Throw)) {
    return new Throw(e);
  }
  if (typeof e === "string") {
    e = new Error(e);
  }
  this.error = e;
  this.stacks = [];
};

module.exports = Throw;
