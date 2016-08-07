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
manager.createGame(["billy", "bob", "sally", "jane"], 420);

var game = manager.getGameFromID(420);
console.log(game.id);
