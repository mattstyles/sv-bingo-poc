
const Koa = require( 'koa' )
const Logger = require( 'koa-bunyan-log' )
const IO = require( 'koa-socket' )
const send = require( 'koa-send' )

const app = new Koa()
const io = new IO()
const logger = new Logger({
  name: 'bingo'
})

io.attach( app )

app.use( async ( ctx, next ) => {
  if ( ctx.path === '/' ) {
    ctx.path = 'index.html'
  }

  await send( ctx, ctx.path, {
    root: __dirname + '/public'
  })
})




const PORT = process.env.PORT || 3000
app.listen( PORT, () => {
  logger.info( 'Server started on', PORT )
})
