angular.module('blackjack')
.factory('mySocket', function (socketFactory, nodeApiAddr) {
  'use strict';
  var myIoSocket = io.connect(nodeApiAddr);
  
  var mySocket = socketFactory({
    ioSocket: myIoSocket
  });
  
  return mySocket;
});