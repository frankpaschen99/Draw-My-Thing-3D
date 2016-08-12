// Dicks out for Harambe

var io = require('socket.io')(7865);
const fs = require('fs');

class GameManager {
  constructor() {
    this.games = [];
  }
  /* Creates a new Game. Takes an array of clients and a unique lobby ID */
  createGame(_id) {
    var newGame = new Game(_id);
    this.games.push(newGame);
    return newGame;
  }
  /* Puts a player in a game if it already exists, creates one if not. Takes a socket.id, string nickname, number gameid*/
  createGameOrJoin(_socket, _nickname, _id) {
    if (this.games.indexOf(this.getGameFromID(_id)) >= 0) this.getGameFromID(_id).joinGame(new Client(_socket, _nickname, _id)); else this.createGame(_id).joinGame(new Client(_socket, _nickname, _id));
  }
  /* Takes an integer ID and returns the game object associated with it */
  getGameFromID(_id) {
    for (var i = 0; i < this.games.length; i++) if (this.games[i].id == _id) return this.games[i];
  }
  leaveGame(client) {
    var game = this.getGameFromID(client.gameid);
    game.leaveGame(client);
  }
  sendChatMessage(gameid, content, socket) {
    this.getGameFromID(gameid).sendChatMessage(content, socket);
  }
}
class Client {
  constructor(_socket, _nickname, _gameid){
    this.socketObject = _socket;
    this.socket = _socket.id
    this.gameid = _gameid; // stores game id the client is in
    this.nickname = _nickname;
    this.score = 0;
  }
  addPoints(pts) {
    this.score += pts;
  }
}
class ClientManager {
  constructor() {
    this.clients = [];
  }
  /* returns the Client object that corrosponds to a socket. Takes a socket.id */
  getClientFromSocket(socket) {
    for (var i = 0; i < this.clients.length; i++) if (this.clients[i].socket == socket) return this.clients[i];
  }
  addClient(client) {
    this.clients.push(client);
  }
  removeClient(client) {
    this.clients.remove(client);
  }
}
var manager = new GameManager();
var clientmanager = new ClientManager();
class Game {
  constructor(_id) {
    console.log("New game " + _id + " created!");
    this.clients = [];
    this.readyClients = 0;
    this.id = _id;
    this.drawing = null;
    this.word = this.pickRandomWord();  // take from dictionary
  }
  ready() {
    this.readyClients++;
    this.beginPreRound();
  }
  /* Randomly chooses the first player to draw */
  pickStartingPlayer() {
    //this.drawing = this.clients[Math.floor(Math.random()*this.clients.length)].nickname;
    this.drawing = this.clients[0].nickname;
  }
  /* Sets the next player as the drawer */
  getNextPlayer(lastPlayer) {
    nextIndex = this.clients.indexOf(lastPlayer)+1;
    if (nextIndex > this.clients.length-1) return this.clients[0]; else return this.clients[nextIndex];
  }
  /* returns a random word for a 459-word file */
  pickRandomWord() {
    return fs.readFileSync("words.txt", 'utf8').split('\n')[Math.floor(Math.random()*459)].trim();
  }
  getWordLength() {
    return this.word.length;
  }
  /* puts a client into the game. takes a Client object for the parameter */
  joinGame(_client) {
    this.clients.push(_client);
    clientmanager.addClient(_client);
    console.log("Player " + _client.nickname + " joined! Number of connnected clients: " + this.clients.length);

    this.sendPlayerList();
    this.sendWordLength();
    this.sendWord();
  }
  leaveGame(_client) {
    if (_client.nickname == this.drawing) {
      // oh no! the drawing player left! Handle this appropriately. (Clear board, restart round, pick new drawing);
    }
    this.clients.remove(_client);
    clientmanager.removeClient(_client);
    console.log("Player " + _client.nickname + " left! Number of connected clients: " + this.clients.length);
    if (this.clients.length == 0) {
      console.log("Game #" + this.id + " removed. Reason: Lobby empty.");
      manager.games.remove(this);
    }
    this.sendPlayerList();
  }
  beginPreRound() {
    // Notify all clients that the game will start in 10 seconds
    if (this.readyClients != this.clients.length) return;

    console.log("beginPreRound() called");
    this.sendChatMessage("The game will begin in 10 seconds...", "SERVER");
    setTimeout(this.beginRound.bind(this), 10000);
  }
  beginRound() {
    this.pickStartingPlayer();
    this.sendChatMessage(this.drawing + " is drawing!", "SERVER");

    this.clients.forEach(function(index) {
      index.socketObject.emit('started');
    });

    /* ROUND STARTED. In 60 seconds, call endRound().*/

    setTimeout(this.endRound.bind(this), 60000);
  }
  endRound() {
    this.sendChatMessage("Round finished!", "SERVER");
    /* ROUND ENDED. Call beginRound() */
  }
  endGame() {
    this.clients.forEach(function(index) {
      index.socketObject.emit('finished');
    });
  }
  /* validates a users' guess. Takes a string (message) and a socket.id */
  guess(content, socket) {
    var client = clientmanager.getClientFromSocket(socket);
    if (content.toLowerCase() == this.word.toLowerCase()) {
      client.addPoints(50);
      this.sendChatMessage(client.nickname + " guessed the word correctly!", "SERVER");
      return true;
    }
    return false;
  }
  // takes String and socket.id (string)
  sendChatMessage(content, socket) {
    this.clients.forEach(function(index) {
      if (socket == "SERVER") {
        index.socketObject.emit('chat', content, "SERVER");
      } else {
        index.socketObject.emit('chat', content, clientmanager.getClientFromSocket(socket.id).nickname);
      }
    });
  }
  sendPlayerList() { // called whenever a player disconnects/joins
    console.log("sendPlayerList() called!");
    var names = [];
    this.clients.forEach(function(index) {
      names.push(index.nickname);
    });
    this.clients.forEach(function(index) {
      index.socketObject.emit('plist', names);
    });
  }
  sendWordLength() {
    for (var i = 0; i < this.clients.length; i++) this.clients[i].socketObject.emit('wordlength', this.getWordLength());
  }
  sendWord() {
    /*for (var i = 0; i < this.clients.length; i++)
      if (this.clients[i].nickname = this.drawing)
        this.clients[i].socketObject.emit('word', this.word*/
      console.log("sendWord() called");
  }
}
Array.prototype.remove = function(object) {
  var index = this.indexOf(object);
  if (index > -1) this.splice(index, 1);
}

/* Socket IO Cancer Below */
io.on('connection', function(socket) {
  console.log("Socket connected" + socket.id);
  socket.on('joingame', function(id, nickname) {  // receive lobbyid and user's nickname
    socket.emit('joingame', true);
    manager.createGameOrJoin(socket, nickname, id);
  });
  socket.on('chat_message', function(content, gameid) {   // called whenever a chat message is sent
    if (clientmanager.getClientFromSocket(socket.id).gameid != gameid) {
      console.log("WARNING! Client attempted to send chat to a game they do not belong in!");
      return;
    }
    if (!manager.getGameFromID(gameid).guess(content, socket.id)) manager.sendChatMessage(gameid, content, socket);
  });
  socket.on('ready', function(gameid) {
    // server recieved the all-clear from the clients, start their game. Do some validation, make sure they can't start the game by other means.
    manager.getGameFromID(gameid).ready();
  });
  socket.on('disconnect', function() {  // get client object and remove them from the game
    var client = clientmanager.getClientFromSocket(socket.id);
    if (typeof client != 'undefined') manager.leaveGame(client);
  });
});

/*

- handle the drawer disconnecting

*/
