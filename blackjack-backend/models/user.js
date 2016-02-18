var User = function(user_id, socket) {
  this.socket = socket || null;
  this.id = user_id;
  this.cards = [];
  this.active = false;
  this.dealer = false;
};

module.exports = {
  User: User
}