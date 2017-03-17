// Dependences
// ==========================
var express = require('express')
var path = require('path')
var http = require('http')

// Midlleware
// ==========================
var favicon = require('serve-favicon')
var compression = require('compression')
var bodyParser = require('body-parser')

// Databease
// ==========================
var mongoose = require('mongoose')
mongoose.Promise = require('bluebird')

// Environment Variables
// ==========================
const envalid = require('envalid')
const { str } = envalid
console.log(`================= ${process.env.NODE_ENV} mode =================`)
envalid.cleanEnv(process.env, {
  PROJECT: str(),
  SERVER_URL: str(),
  VALIDATION_TOKEN: str(),
  FB_APP_ID: str(),
  // FB_APP_SECRET: str(),
  FB_PAGE_ID: str(),
  PAGE_ACCES_TOKEN: str(),
  DB_URL : str(),
  GOB_PRECIOS_URL: str(),
  GOB_PLACES_URL: str(),
  GOB_BLOG_URL: str()
})


// Models
// ==========================
var gasStationModel = require(path.join(__dirname, 'src/models/gasStation'))()
var GasStation = mongoose.model('GasStation')

// Routes
// ==========================
var index = require(path.join(__dirname, 'src/routes/index/index'))
var stations = require(path.join(__dirname, 'src/routes/stations/stations'))
var prices = require(path.join(__dirname, 'src/routes/prices/prices'))
var states = require(path.join(__dirname, 'src/routes/states/states'))
// var webhook = require(path.join(__dirname, 'src/routes/webhook/webhook'))

// Databease Setup
// ==========================
var dbSetup = require(path.join(__dirname, 'src/controllers/dbSetup'))
dbSetup.init()

// Server Setup
// ==========================

var app = express()

global.appRoot = path.resolve(__dirname);

var port = process.env.PORT || 4000
app.set('port', port)

app.set('views', path.join(__dirname, 'src/views'))
app.set('view engine', 'pug')

app.use(favicon(path.join(__dirname, 'src/public', 'favicon.ico')))
app.use(compression())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'src/public')))

var server = http.createServer(app)
server.on('error', onError)
server.on('listening', onListening)

// Routes Setup
// ==========================
app.use('/', index)
app.use('/station',	stations)
app.use('/prices',	prices)
app.use('/states',	states)
// app.use('/webhook', webhook)

// Event listener for HTTP server "error" event.
// ==========================
function onError (error) {
  console.log(error)
  if (error.syscall !== 'listen') throw error

  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error(bind + ' is already in use')
      process.exit(1)
      break
    default:
      throw error
  }
}

// Event listener for HTTP server "listening" event.
// ==========================
function onListening () {
  var addr = server.address()
  var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port
  console.error('Listening on ' + bind)
  // debug('Listening on ' + bind)
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

// Start Listen Serve
// ==========================
app.listen(app.get('port'), function () {
  console.log(process.env.PROJECT + ' on port', app.get('port'))
})
module.exports = app
