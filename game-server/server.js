var io = require('socket.io')(9001);

class Game {
  constructor() {
    this.users = [];
    this.drawing;
  }
  pickStartingPlayer() {
    this.drawing = this.users[Math.floor(Math.random()*this.users.length)];
  }
  getNextPlayer(lastPlayer) {
    nextIndex = this.users.indexOf(lastPlayer)+1;
    nextIndex > this.users.length-1 ? this.drawing = this.users[0] : this.drawing = this.users[nextIndex];
  }
}
