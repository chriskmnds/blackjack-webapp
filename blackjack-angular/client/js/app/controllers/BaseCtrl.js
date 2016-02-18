angular.module('blackjack')
.controller('BaseCtrl', function($scope, $state) {
  'use strict';
  $scope.ctrlName = 'BaseCtrl';
  $scope.state = $state;
  $scope.pageTitle = "Simple BlackJack Game"
});
