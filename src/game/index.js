
const Logger = require( 'koa-bunyan-log' )
const shuffle = require( 'knuth-shuffle' ).knuthShuffle

const EVENTS = require( '../events' )
const Player = require( './player' )

const logger = new Logger({
  name: 'bingo'
})

const NUM_PLAYERS = 2
const NUM_BALLS = 90
const TICK_SPEED = 1000
const PLAYER_NUMS = 5

const GAME_STATES = {
  WAITING: 'game:waiting',
  PLAYING: 'game:playing'
}


/**
 * Used as a base for the shuffling
 */
const masterPool = []
for ( var i = 0; i < NUM_BALLS; i++ ) {
  masterPool.push( i )
}

/**
 * Pulls out a shuffled array from the masterPool
 */
function createPool( num ) {
  return shuffle( masterPool.slice( 0 ) ).slice( NUM_BALLS - num )
}



class Game {
  constructor( opts ) {
    if ( !opts || !opts.io ) {
      throw new Error( 'Game initialisation failed, no option params' )
    }

    this.io = opts.io

    this.players = new Map()

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
    if ( !this.players.size >= NUM_PLAYERS  ) {
      logger.info( 'Lobby full, can not connect', ctx.socket.id )
      ctx.socket.emit( EVENTS.FULL )
      return
    }

    logger.info( 'Adding player', ctx.socket.id )
    this.players.set( ctx.socket.id, new Player({
      socket: ctx.socket,
      numbers: createPool( PLAYER_NUMS )
    }))

    // Attach disconnect now that this player is in the system
    ctx.socket.on( 'disconnect', () => {
      this.onDisconnect( ctx.socket.id )
    })

    // Check if the game is now full and can begin
    if ( this.players.size === NUM_PLAYERS ) {
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
    if ( this.players.has( id ) ) {
      this.players.delete( id )
    }
  }

  /**
   * Helper to send messages to all players
   * Not all connections will be players
   */
  broadcast( msg, data ) {
    this.players.forEach( player => {
      player.emit( msg, data )
    })
  }

  /**
   * All players are ready so lets rock and roll
   */
  start() {
    logger.info( 'New game starting' )
    this.state = GAME_STATES.PLAYING

    this.pool = createPool( NUM_BALLS )

    this.players.forEach( player => player.start() )

    // Give the UI a chance before spitting balls out of the pool
    setTimeout( this.gameTick, 1000 )
  }

  gameTick = () => {

    let number = this.pool.pop()

    logger.info( 'Drawing number', number )
    this.broadcast( EVENTS.NUMBER, {
      number: number
    })

    // Game exit condition
    if ( this.pool.length === 0 ) {
      logger.info( 'Game has finished' )
      this.broadcast( EVENTS.WINNER, {
        player: '@TODO who is the winner?'
      })
      return
    }

    setTimeout( this.gameTick, TICK_SPEED )
  }
}


module.exports = Game
