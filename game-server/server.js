var io = require('socket.io')(9001);

class Game {
  constructor(_clients, _id) {
    this.clients = _clients;
    this.id = _id;
    this.drawing = this.pickStartingPlayer();
  }
  /* Randomly chooses the first player to draw */
  pickStartingPlayer() {
    this.drawing = this.clients[Math.floor(Math.random()*this.clients.length)];
  }
  /* Sets the next player as the drawer */
  getNextPlayer(lastPlayer) {
    nextIndex = this.clients.indexOf(lastPlayer)+1;
    nextIndex > this.clients.length-1 ? this.drawing = this.clients[0] : this.drawing = this.clients[nextIndex];
  }
}
class GameManager {
  constructor() {
    this.games = [];
  }
  /* Takes an array of clients as well as a unique lobby ID */
  createGame(_clients, _id) {
    this.games.push(new Game(_clients, _id));
  }
  /* Takes an integer ID and returns the game object associated with it */
  getGameFromID(_id) {
    for (var i = 0; i < this.games.length; i++)
      if (this.games[i].id == _id) return this.games[i];
  }
}
class Client {
  constructor(_socket, _nickname){
    this.socket = _socket;
    this.nickname = _nickname;
  }
}
Array.prototype.remove = function(object){
  var index = this.indexOf(object);
  if(index > -1){
    this.splice(index, 1);
  }
}

var manager = new GameManager();

/* Socket IO Cancer Below */
io.on('connection', function(socket) {
  socket.on('joingame', function(id) {
    socket.join(id);
  });
});

// Emit to a specific room: io.to('roomid').emit('event', 'content');
// We'll need to send each client in each room the chat/drawings

// The client needs to wait for events so the server can send shit to their room.
/*
Example (clientside):
  socket.on('message', function(data) {
   console.log('Incoming message:', data);
  });
And serverside:
  io.to('roomid').emit('message', 'what is going on, party people?');
*/
