angular.module('blackjack')
.factory('common', function() {
  'use strict';
  
  /**
   * Find index of object in array given some property value.
   * @param {array} myArray
   * @param {string} property
   * @param {any} searchTerm
   */
  var arrayObjectIndexOf = function(myArray, property, searchTerm) {
    for(var i = 0, len = myArray.length; i < len; i++) {
      if (myArray[i][property] === searchTerm) return i;
    }
    return -1;
  };

  /**
   * Find index of item in array.
   * @param {array} myArray
   * @param {any} searchTerm
   */  
  var arrayIndexOf = function(myArray, searchTerm) {
    for(var i = 0, len = myArray.length; i < len; i++) {
      if (myArray[i] === searchTerm) return i;
    }
    return -1;
  };
  
  return { 
    arrayObjectIndexOf: arrayObjectIndexOf,
    arrayIndexOf: arrayIndexOf
  };
});