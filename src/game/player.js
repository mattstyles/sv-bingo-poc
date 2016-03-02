
class Player {
  constructor( socket ) {
    this.socket = socket
  }

  emit = ( msg, data ) => {
    this.socket.emit( msg, data )
  }

}

module.exports = Player
