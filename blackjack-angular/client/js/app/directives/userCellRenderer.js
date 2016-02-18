/**
 * Directive for rendering individual user columns/cells.
 *  - Currently adds a class of col-sm-{col_size set at parent row => 3} for 4-column grid
 *  - Can turn this into a dynamic template with variable column size 
 *    based on number of users in each row
 */
angular.module('blackjack')
  .directive('userCellRenderer', function(appVersion) {
    'use strict';
    var directive = {
      restrict: 'E',
      scope: true,
      link: function(scope, element, attrs) {
        var col_size = element[0].parentElement.attributes.inner_col_size.value;
        angular.element(element).addClass('col-sm-' + col_size);
      }
    };
    return directive;
  });