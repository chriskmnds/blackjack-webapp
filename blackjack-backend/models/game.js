var shortid = require('shortid');
var User = require('./user').User;
var Deck = require('./deck').Deck;

var Game = function() {
  this.io = undefined;
  this.users = [];
  this.active_users = [];
  this.deck = {};
  this.freshstart = true;// fresh start (no previous running table)
  this.running = false;
  this.next_player = 0;// the next player to act (hit/stick). 0 is the dealer (1st player in list)
  this.max_active_users = 8;
  this.init();
};

/** 
 * Function for game initialisation.
 *  - Initialise user list with a dealer
 */
Game.prototype.init = function() {
  this.users = [];
  var user = new User(shortid.generate());
  user.dealer = true;
  user.active = true;
  this.users.push(user);
};

/**
 * Function to start a new game.
 *  - A deck is initialised and shuffled
 *  - A dealer is set to the active users list
 *  - All currently connected users become active (up to the max_active_users limit)
 *  - Each player receives 2 cards from top of deck, except from dealer
 */
Game.prototype.start_game = function() {
  console.log('Game started');
  var _this = this;
  this.running = true;
  this.deck = new Deck();
  this.next_player = 0;// index in user list (index 0 is the dealer)
  this.active_users = [];
  this.active_users.push(this.users[0]);
  this.update_user_status();
  this.update_user_view();
  for (var i in this.active_users) {
    (function(i) {
      var user = _this.active_users[i];
      user.cards = [];
      if (!user.dealer) {
        // deal two cards per user
        user.socket.emit('status', {wait: true, new_game: true, msg: "New Game started! Wait for your turn!"});
        _this.deal_card(user);
        _this.deal_card(user);
      }
    }(i));
  }
  this.notify_next_player();
};

/**
 * Function to clean up current round.
 *  - Clean users' cards
 *  - Mark a game as not running
 */
Game.prototype.close_game = function() {
  console.log('closing game');
  for (var i in this.users) {
    this.users[i].cards = [];
  }
  this.active_users = [];
  this.running = false;
};

/**
 * Function to update user status.
 *  - Update user status to active and add more users to active_users list
 */
Game.prototype.update_user_status = function() {
  var max_index = (this.users.length <= this.max_active_users ? this.users.length : this.max_active_users);
  for (var i = this.active_users.length; i < max_index; i++) {
    var user = this.users[i];
    user.active = true;
    this.active_users.push(user);
  }
};

/**
 * Function to update given user's view (send all table cards to user).
 *  - Will update ALL users' view if no user passed
 */
Game.prototype.update_user_view = function(user_) {
  var cards = [];
  for (var i in this.active_users) {
    var _user = this.active_users[i];
    cards.push({user: _user.id, dealer: _user.dealer, cards: this.prepare_cards_for_display(_user)});
  }
  if (user_) {
    user_.socket.emit('table_cards', {table: cards});
  } else {
    this.io.emit('table_cards', {table: cards});
  }
};
  
/** 
 * Function to notify next player to act.
 */
Game.prototype.notify_next_player = function() {
  this.next_player = this.next_player + 1;// index 0 is the dealer
  if (this.next_player == this.active_users.length) {
    // all players have taken turns. time for dealer to act
    this.dealer_act();
    // finalize game (determine losers/winners)
    this.finalize_game();
    // start new game (close this game, wait, start)
    this.close_game();
    var _self = this;
    setTimeout(function() {
        _self.start_game();
      }, 7000);
  } else {
    var _user = this.active_users[this.next_player];
    if (_user) {
      _user.socket.emit('status', {wait: false, msg: 'Your turn! HIT or STICK!'});
    }
  }
};

/** 
 * Simple strategy for dealer.
 *  - Two possible sums from his/her cards (one with ACE = 1, one with ACE = 11)
 *  - Continue hitting while highest sum is less than 17
 *  - If highest sum exceeds 21 switch to lowest sum and continue hitting until over 17
 */
Game.prototype.dealer_act = function() {
  console.log('Time for dealer to act');
  var total = 0;
  var dealer = this.active_users[0];
  while(total < 17) {
    this.deal_card(dealer);
    total = this.highest_sum_from_cards(dealer);
  }
  dealer.total = total;
  this.io.emit('score', {user: dealer.id, score: dealer.total});
};

/**
 * Function to compute all users' scores and compare with dealer's.
 *  - Dealer total computed earlier while hitting (dealer_act).
 */
Game.prototype.finalize_game = function() {
  console.log('Time to determine losers/winners');
  for (var i = 1, len = this.active_users.length; i < len; i++) {
    var user = this.active_users[i];
    user.total = this.highest_sum_from_cards(user);
    
    this.io.emit('score', {user: user.id, score: user.total});
    
    if (user.total > 21) {
      user.socket.emit('status', {wait: true, msg: 'You LOST! Wait for next round..'});
    } 
    else if (this.active_users[0].total > 21) {
      user.socket.emit('status', {wait: true, msg: 'You WON! Wait for next round..'});
    }
    else if (user.total === this.active_users[0].total) {
      user.socket.emit('status', {wait: true, msg: 'TIE! Wait for next round..'});
    } 
    else if (user.total > this.active_users[0].total) {
      user.socket.emit('status', {wait: true, msg: 'You WON! Wait for next round..'});
    } 
    else {
      user.socket.emit('status', {wait: true, msg: 'You LOST! Wait for next round..'});
    }
  }
};

/** 
 * Function to get highest sum <= 21 from user's cards. 
 *  @param {object} user
 */
Game.prototype.highest_sum_from_cards = function(user) {
  var total = 0;
  var values = [];
  values[0] = [];
  values[1] = [];
  for (var i in user.cards) {
    var card = user.cards[i];
    var card_value = card.value;
    if (["J","Q","K"].indexOf(card_value) > -1) {
      values[0].push(10);
      values[1].push(10);
    } else if (parseInt(card_value) > 1) {
      values[0].push(parseInt(card_value));
      values[1].push(parseInt(card_value));
    } else {
      values[0].push(1);
      values[1].push(11);
    }
  }
  var sum_low = values[0].reduce(function(a, b){return a+b;});
  var sum_high = values[1].reduce(function(a, b){return a+b;});
  total = ((sum_high <= 21) ? sum_high : sum_low);
  return total;
};

/**
 * Function to deal cards. 
 *  - Deals a single card to user 
 *  - Broadcasts user's cards to eveyone else
 */
Game.prototype.deal_card = function(user) {
  var card = this.deck.popCard();
  user.cards.push(card);
  if (!user.dealer) {
    user.socket.emit('card', {card: card});
  }
  this.io.emit('user_cards', {user: user.id, dealer: user.dealer, cards: this.prepare_cards_for_display(user)});
};

/**
 * Function to prepare cards for display to other users.
 *  - If user is dealer, first card is hidden
 *  - If user is not dealer, first two cards are hidden
 */
Game.prototype.prepare_cards_for_display = function(user) {
  var cards = [];
  if (!user.dealer) {
    for (var i in user.cards) {
      if (i <= 1) {
        cards.push({card: {}, hidden: true});
      } else {
        cards.push({card: user.cards[i], hidden: false});
      }
    }
  } else {
    for (var i in user.cards) {
      if (i == 0) {
        cards.push({card: {}, hidden: true});
      } else {
        cards.push({card: user.cards[i], hidden: false});
      }
    }
  }
  return cards;
};

Game.prototype.lookup_user_by_socket = function(socket, list) {
  for (var i in list) {
		if (list[i].socket === socket) return i;
	}
	return -1;
};

/**
 * Remove user from game when disconnected.
 *  - Close game if only the dealer is left
 *  - Otherwise update users' "active" status
 */
Game.prototype.remove_user = function(socket) {
  var idx = this.lookup_user_by_socket(socket, this.users);
  var idx2 = this.lookup_user_by_socket(socket, this.active_users); 
  if (idx > -1) {
    this.users.splice(idx,1);
    if (this.users.length == 1) {
      // everyone left..
      this.freshstart = true;
      this.close_game();
    }
  }
  if (idx2 > -1) {
    this.active_users.splice(idx2,1);
    this.update_user_status();
    if(this.active_users.length > 1) {
      this.start_game();
    }
  }
};

module.exports = {
  Game: Game
}