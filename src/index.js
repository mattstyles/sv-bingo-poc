
const Koa = require( 'koa' )
const Logger = require( 'koa-bunyan-log' )
const IO = require( 'koa-socket' )
const send = require( 'koa-send' )

const Game = require( './game' )

const app = new Koa()
const io = new IO()
const logger = new Logger({
  name: 'server'
})

const game = new Game({
  io: io
})

/**
 * Attach socket.io to the app instance
 */
io.attach( app )

/**
 * IO specific logging
 */
io.use( logger.attach({
  as: 'log'
}))

/**
 * Basic events, game will attach the rest itself
 */
io.on( 'connection', game.onConnection )


/**
 * Server request logging
 */
app.use( logger.attach({
  as: 'log'
}))
app.use( logger.attachRequest() )

/**
 * Static asset serving
 */
app.use( async ( ctx, next ) => {
  if ( ctx.path === '/' ) {
    ctx.path = 'index.html'
  }

  await send( ctx, ctx.path, {
    root: __dirname + '/public'
  })
})


/**
 * Go
 */
const PORT = process.env.PORT || 3000
app.listen( PORT, () => {
  logger.info( 'Server started on', PORT )
})
