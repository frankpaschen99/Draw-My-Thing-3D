var io = require('socket.io')(9001);
const fs = require('fs');
class Game {
  constructor(_clients, _id) {
    this.clients = _clients;
    this.id = _id;
    this.drawing = this.pickStartingPlayer();
    this.word = this.pickRandomWord();  // take from dictionary
  }
  /* Randomly chooses the first player to draw */
  pickStartingPlayer() {
    this.drawing = this.clients[Math.floor(Math.random()*this.clients.length)];
  }
  /* Sets the next player as the drawer */
  getNextPlayer(lastPlayer) {
    nextIndex = this.clients.indexOf(lastPlayer)+1;
    if (nextIndex > this.clients.length-1) return this.clients[0]; else return this.clients[nextIndex];
  }
  pickRandomWord() {
    return fs.readFileSync("words.txt", 'utf8').split('\n')[Math.floor(Math.random()*459)];
  }
  joinGame(_client) {
    this.clients.push(_client);
    console.log("Player joined game #" + this.id + "! Nickname: " + _client.nickname);
  }
  run() {

  }
  guess(text, client) {

  }
}
class GameManager {
  constructor() {
    this.games = [];
  }
  /* Takes an array of clients as well as a unique lobby ID */
  createGame(_clients, _id) {
    this.games.push(new Game(_clients, _id));
    console.log("New game created! id: " + _id);
  }
  createGameOrJoin(_socket, _nickname, _id) {
    if (this.games.indexOf(this.getGameFromID(_id)) >= 0) this.getGameFromID(_id).joinGame(new Client(_socket, _nickname)); // game already exists, jou
    else this.createGame([new Client(_socket, _nickname)], _id);  // game doesn't exist, create a new one and join it
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
    this.score = 0;
  }
  addPoints(pts) {
    this.score += pts;
  }
}
Array.prototype.remove = function(object){
  var index = this.indexOf(object);
  if(index > -1){
    this.splice(index, 1);
  }
}

var manager = new GameManager();
manager.createGame(["test"], 420);


/* Socket IO Cancer Below */
io.on('connection', function(socket) {
  socket.on('joingame', function(id, nickname) {  // receive lobbyid and user's nickname
    manager.createGameOrJoin(socket.id, nickname, id);
    socket.join(id);  // join a new room with the lobbyid
    io.to(id).emit('startgame', manager.getGameFromID(id)); // must be implemented clientside
  });
});

// Emit to a specific room: io.to('roomid').emit('event', 'content');
// We'll need to send each client in each room the chat/drawings
// Each room must have its own Game instance

// The client needs to wait for events so the server can send shit to their room.
/*
Example (clientside):
  socket.on('message', function(data) {
   console.log('Incoming message:', data);
  });
And serverside:
  io.to('roomid').emit('message', 'what is going on, party people?');
*/
