var cors = require('cors'),
  express = require('express'),
  bodyParser  = require('body-parser'),
  morgan = require('morgan'),
  shortid = require('shortid'),
  Game = require('./models/game').Game,
  User = require('./models/user').User;
  
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Keep track of all connected sockets
//var sockets = [];

// use cors, restrict origin
app.use(cors({origin: 'http://localhost:8000'}));

// use bodyparser so we can grab information from POST requests
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// log all requests to the console
app.use(morgan('dev'));


var game = new Game();
game.io = io;

/**
 * When new user is connected.
 *  - Push user to game's user list
 *  - If maximum active users on table reached, ask to try again later or wait for next round
 *  - If game is running, update user's view and status, and ask to wait for next round
 *  - If game is idle, no other user is active. start game with this user alone
 */
io.on('connection', function(socket) {
  console.log('a user connected');
  
  // save socket for disconnecting on server restart
  //sockets.push(socket);
  
  // create user, add to game
  var user_id = shortid.generate();
  var user = new User(user_id, socket);
  game.users.push(user);
  
  // send user_id to user
  socket.emit('id', {id: user.id});
  
  // send status message to user and update his/her view (cards on table)
  if (game.users.length > game.max_active_users) {
    socket.emit('status', {wait: true, msg: 'Max players on table. Try again later or wait for next round..'});
    game.update_user_view(user);
  } else if (game.running) {
    socket.emit('status', {wait: true, msg: 'Wait for next round..'});
    game.update_user_view(user);
  } else if (game.freshstart) {
    game.freshstart = false;
    game.update_user_view(user);
    game.start_game();
  }
  
  /**
   * User disconnected. Remove user from lists.
   */  
  socket.on('disconnect', function() {
    console.log('a user disconnected');
    game.remove_user(socket);
    //socket.server.close();
  });
  
  /**
   * Deal a card to the user.
   */
  socket.on('hit', function() {
    console.log('user HIT');
    user.socket.emit('status', {wait: false, msg: 'Your turn! HIT or STICK!'});
    game.deal_card(user);
  });

  /**
   * User stick. Notify next player to take turn.
   */  
  socket.on('stick', function() {
    console.log('user STICK');
    socket.emit('status', {wait: true, msg: 'Alright! Wait for result!'});
    game.notify_next_player();
  });
});


http.listen(3000);
console.log('Listening on port 3000...');

/**
 * Clean up on exit.
 * - Close servers
 * - Disconnect all subscribed sockets
 */
var gracefulExit = function() {
  console.log('exiting now..');
  io.httpServer.close();
  http.close();
  /*for (var i in sockets) {
    console.log('socket', sockets[i].id, 'destroyed');
    sockets[i].disconnect();
  }*/
}

var logUncaughtServerError = function(err) {
    console.log(err);
};

process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);
process.on('uncaughtException', logUncaughtServerError);
