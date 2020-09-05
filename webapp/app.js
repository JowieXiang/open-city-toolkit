// Read config
require('dotenv').config()

const geoserverUrl = process.env.GEOSERVER_URL
const lat = process.env.INITIAL_LAT || 0
const lon = process.env.INITIAL_LON || 0

// Express server
const express = require('express')

require('pug')
const app = express()
const expressPort = 3000

app.listen(expressPort, () => {
  console.log(`App listening on port ${expressPort}`)
})

// Static files
app.use(express.static('public'))
app.use('/output', express.static('../output'))
app.use('/lib/jquery', express.static('node_modules/jquery/dist'));
app.use('/lib/bootstrap', express.static('node_modules/bootstrap/dist'));
app.use('/lib/leaflet', express.static('node_modules/leaflet/dist'));
app.use('/lib/leaflet-draw', express.static('node_modules/leaflet-draw/dist'));
app.use('/lib/leaflet-groupedlayercontrol', express.static('node_modules/leaflet-groupedlayercontrol/src'));

// Authentication
app.use(require('./routes/auth'))
app.use(require('./routes/modules'))


// Views (using Pug template engine)
app.set('views', './views')
app.set('view engine', 'pug')

// index page
app.get('/', checkAuthenticated, (req, res) => {
  let options = {
    geoserverUrl,
    lat,
    lon
  }
  res.render('launch', options)
})

// FIXME: merge with checkNotAuthenticated
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/login')
}
