var shuffle = require('shuffle-array');

var Deck = function() {
  this.cards = [];
  this.init();
};

/** 
 * Initialise and shuffle deck.
 */
Deck.prototype.init = function() {
  this.createDeck();
  this.shuffle();
};

/** 
 * Refresh cards with new deck.
 */
Deck.prototype.createDeck = function() {
  this.cards = [];
  var suits = ["hearts","diams", "clubs", "spades"];
  for (var i in suits) {
    var suit_values = ["1","2","3","4","5","6","7","8","9","10", "J","Q","K"];
    for (var j in suit_values) {
      this.cards.push({"value": suit_values[j], "suit": suits[i]});
    }
  }
};

/**
 * Shuffle deck using Fisher-Yates algorithm 
 */
Deck.prototype.shuffle = function() {
  shuffle(this.cards);
};

/**
 * Pop card from deck and return card 
 */
Deck.prototype.popCard = function() {
  return this.cards.splice(0, 1)[0];
};

module.exports = {
  Deck: Deck
}