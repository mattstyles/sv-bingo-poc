
const EVENTS = require( '../events' )

class Player {
  constructor( opts ) {
    if ( !opts ) {
      throw new Error( 'Error creating player, incorrect instantiation parameters' )
    }

    this.socket = opts.socket
    this.numbers = opts.numbers
  }

  emit = ( msg, data ) => {
    this.socket.emit( msg, data )
  }

  start = () => {
    console.log( 'emitting start event', this.numbers )
    this.socket.emit( EVENTS.STARTING, {
      numbers: this.numbers
    })
  }

}

module.exports = Player
