
const Logger = require( 'koa-bunyan-log' )

const EVENTS = require( '../events' )
const Player = require( './player' )

const logger = new Logger({
  name: 'bingo'
})

const NUM_PLAYERS = 2

const GAME_STATES = {
  WAITING: 'game:waiting',
  PLAYING: 'game:playing'
}



class Game {
  constructor( opts ) {
    if ( !opts || !opts.io ) {
      throw new Error( 'Game initialisation failed, no option params' )
    }

    this.io = opts.io

    this.connections = new Map()

    this.state = GAME_STATES.WAITING
  }

  /**
   * Handles a new connection if there is room in this lobby
   */
  onConnection = ctx => {
    logger.info( 'Client connected', ctx.socket.id )

    if ( this.state !== GAME_STATES.WAITING ) {
      logger.info( 'Game already in progress, can not connect', ctx.socket.id )
      ctx.socket.emit( EVENTS.IN_PROGRESS )
      return
    }

    // Check full game
    if ( !this.connections.size >= NUM_PLAYERS  ) {
      logger.info( 'Lobby full, can not connect', ctx.socket.id )
      ctx.socket.emit( EVENTS.FULL )
      return
    }

    logger.info( 'Adding player', ctx.socket.id )
    this.connections.set( ctx.socket.id, new Player( ctx.socket ) )

    // Attach disconnect now that this player is in the system
    ctx.socket.on( 'disconnect', () => {
      this.onDisconnect( ctx.socket.id )
    })

    // Check if the game is full and can begin
    if ( this.connections.size === NUM_PLAYERS ) {
      logger.info( `Lobby has ${ NUM_PLAYERS } players, getting it on` )
      this.start()
    }
  }

  /**
   * Handles a player disconnecting from the server
   * Its brutal, just immediately boots them
   */
  onDisconnect = id => {
    logger.info( 'Client disconnected', id )
    this.connections.delete( id )
  }

  /**
   * All players are ready so lets rock and roll
   */
  start() {
    logger.info( 'New game starting' )
    this.state = GAME_STATES.PLAYING

    var count = 0

    const tick = () => {
      logger.info( 'tick' )
      this.connections.forEach( player => {
        player.emit( 'test', {
          foo: 'bitches'
        })
      })

      if ( count++ < 20 ) {
        setTimeout( tick, 1000 )
      }
    }

    tick()
  }
}


module.exports = Game
