/**
 * Directive for rendering individual user cards.
 */
angular.module('blackjack')
  .directive('userCardsRenderer', function(appVersion) {
    'use strict';
    var directive = {
      restrict: 'E',
      scope: {
        user: '='
      },
      templateUrl: '/' + appVersion + '/directives/user-cards-renderer.html',
      link: function(scope, element, attrs) {
        /**
         * Wraps a given string with "&" and ";" for html ascii symbols etc.
         * @param {string} txt
         */
        scope.wrap_code = function(txt) {
          return "&" + txt + ";";
        }
      }
    };
    return directive;
  });