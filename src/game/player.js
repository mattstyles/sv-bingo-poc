
const Logger = require( 'koa-bunyan-log' )

const EVENTS = require( '../events' )

class Player {
  constructor( opts ) {
    if ( !opts ) {
      throw new Error( 'Error creating player, incorrect instantiation parameters' )
    }

    // First two characters of socket io are currently nsp id, which we dont
    // care about at the moment
    this.logger = new Logger({
      name: opts.socket.id.slice( 2 )
    })

    this.socket = opts.socket
    this.numbers = opts.numbers.map( num => {
      return {
        num: num,
        checked: false
      }
    })

    // Triggered when this set is complete
    this.onComplete = opts.onComplete
  }

  emit = ( msg, data ) => {
    this.socket.emit( msg, data )
  }

  start = () => {
    // Emit just the numbers for the client
    this.socket.emit( EVENTS.STARTING, {
      numbers: this.numbers.map( item => item.num )
    })
  }

  /**
   * Will trigger the onComplete callback if its complete
   */
  checkNumber( number ) {
    this.emit( EVENTS.NUMBER, {
      number: number
    })

    let found = this.numbers.find( item => item.num === number )

    // If no number was found then bail
    if ( !found ) {
      return false
    }

    // Update that this number is no longer required
    // and return if we are complete or not
    this.logger.info( 'Checked', number )
    found.checked = true

    // Check if we're done
    if ( this._checkComplete() ) {
      this.onComplete( this )
    }
  }

  /**
   * @private
   * @returns <Boolean> true if all numbers have been checked
   */
  _checkComplete() {
    return !this.numbers.find( item => !item.checked )
  }

}

module.exports = Player
