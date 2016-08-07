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
    return this.clients[Math.floor(Math.random()*this.clients.length)];
  }
  /* Sets the next player as the drawer */
  getNextPlayer(lastPlayer) {
    nextIndex = this.clients.indexOf(lastPlayer)+1;
    if (nextIndex > this.clients.length-1) return this.clients[0]; else return this.clients[nextIndex];
  }
  /* returns a random word for a 459-word file */
  pickRandomWord() {
    return fs.readFileSync("words.txt", 'utf8').split('\n')[Math.floor(Math.random()*459)];
  }
  /* puts a client into the game. takes a Client object for the parameter */
  joinGame(_client) {
    this.clients.push(_client);
    console.log("Player joined game #" + this.id + "! Nickname: " + _client.nickname);
  }
  leaveGame(_socket) {
    this.clients.remove(getClientFromSocket(_socket));
  }
  run() {
    // draw text, unlock the drawing board, etc...
    // everything the player sees and interacts with goes here
    console.log("Game is now running!");
  }
  /* validates a users' guess. Takes a string (message) and a socket.id */
  guess(content, socket) {
    client = getClientFromSocket(socket);
    if (content == this.word) client.addPoints(50);
    console.log(client.nickname + " guessed the word correctly!");
    // todo: do more than just add points
  }
  /* returns the Client objcet that corrosponds to a socket. Takes a socket.id */
  getClientFromSocket(socket) {
    for (var i = 0; i < this.clients.length; i++)
    if (this.clients[i].socket == socket) return this.clients[i];
  }
}
class GameManager {
  constructor() {
    this.games = [];
  }
  /* Creates a new Game. Takes an array of clients and a unique lobby ID */
  createGame(_clients, _id) {
    this.games.push(new Game(_clients, _id));
    console.log("New game created! id: " + _id);
  }
  /* Puts a player in a game if it already exists, creates one if not. Takes a socket.id, string nickname, number gameid*/
  createGameOrJoin(_socket, _nickname, _id) {
    if (this.games.indexOf(this.getGameFromID(_id)) >= 0) this.getGameFromID(_id).joinGame(new Client(_socket, _nickname)); // game already exists, jou
    else this.createGame([new Client(_socket, _nickname)], _id);  // game doesn't exist, create a new one and join it
  }
  /* Takes an integer ID and returns the game object associated with it */
  getGameFromID(_id) {
    for (var i = 0; i < this.games.length; i++)
    if (this.games[i].id == _id) return this.games[i];
  }
  /* Really ugly and not sure if it works. Will improve later. */
  leaveGame(_socket) {
    for (var i = 0; i < this.games.length; i++)
      for (var j = 0; j < this.games[i].clients.length; j++)
        if (this.games[i].clients[j].socket == _socket)
          this.games[i].leaveGame(_socket);
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
  if(index > -1) this.splice(index, 1);
}

var manager = new GameManager();

/* Socket IO Cancer Below */
io.on('connection', function(socket) {
  socket.on('joingame', function(id, nickname) {  // receive lobbyid and user's nickname
    manager.createGameOrJoin(socket.id, nickname, id);
    socket.join(String(id));  // TODO: this doesn't work. It only works outside of socket.on. Find a fix.
    console.log(socket.rooms);
  });
  socket.on('chat', function(socket, content, gameid) {   // called whenever a chat message is sent
    manager.getGameFromID(gameid).guess(content, socket);
  });
  socket.on('startgame', function(gameid) {   // called when all clients are ready
    manager.getGameFromID(gameid).run();
  });
  socket.on('disconnect', function() {
    manager.leaveGame(socket.id);
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

// Todo: on disconnect of player, check if there are zero people in the lobby. If so, destroy the Game object
