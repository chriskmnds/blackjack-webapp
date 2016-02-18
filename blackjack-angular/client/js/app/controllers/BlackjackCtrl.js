/**
 * Controller for handling communication with socket.io backend and updating variables accordingly.
 */
angular.module('blackjack')
.controller('BlackjackCtrl', function($scope, $state, mySocket, common) {
  'use strict';
  $scope.ctrlName = 'BlackjackCtrl';
  $scope.state = $state;
  
  mySocket.forward(['status', 'card', 'table_cards', 'user_cards', 'score', 'id'], $scope);
  
  $scope.users = [];
  $scope.status = {};
  $scope.current_user = {
    user: undefined,//id
    cards: [],
    score: 0,
    dealer: false,
    self: true
  };

  /**
   * Handle status update from backend.
   *  - Refresh current_user if new_game flag sent
   */    
  $scope.$on('socket:status', function (ev, data) {
    $scope.status = data;
    if ($scope.status.new_game) {
      $scope.current_user.cards = [];
      $scope.current_user.score = 0;
    }
  });

  /**
   * Handle a new card dealt from backend.
   */   
  $scope.$on('socket:card', function (ev, data) {
    $scope.current_user.cards.push(data);
  });
  
  /**
   * Handle table cards (users) updated.
   */  
  $scope.$on('socket:table_cards', function (ev, data) {
    $scope.users = data.table;
  });

  /**
   * Handle other user dealt a card.
   *  - update specific cell in users list
   */  
  $scope.$on('socket:user_cards', function (ev, data) {
    var _user_idx = common.arrayObjectIndexOf($scope.users, "user", data.user);
    $scope.users[_user_idx].cards = data.cards;
  });
  
  /**
   * Handle id issued when connecting.
   */
  $scope.$on('socket:id', function (ev, data) {
    $scope.current_user.id = data.id;
  });
  
  /**
   * Handle scores issued from backend.
   *  - will arrive for each active user
   *  - grab this user's score and update $scope.current_user
   */
  $scope.$on('socket:score', function (ev, data) {
    var _user_idx = common.arrayObjectIndexOf($scope.users, "user", data.user);
    $scope.users[_user_idx].score = data.score;
    if (data.user === $scope.current_user.id) {
      $scope.current_user.score = data.score;
    }
  });

  /**
   * Restarts timer on every hit.
   */  
  $scope.hit = function() {
    $scope.status.wait = true;// will restart the timer
    mySocket.emit('hit');
  }   

  $scope.stick = function() {
    mySocket.emit('stick');
  }
});
