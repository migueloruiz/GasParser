var express = require('express')
var mongoose = require('mongoose')
var GasStation = mongoose.model('GasStation')
var router = express.Router()

router.get('/', function (req, res, next) {
  let userLat = parseFloat(req.query.user_lat)
  let userLong = parseFloat(req.query.user_long)
  let range = parseInt(req.query.range)
  res.setHeader('Content-Type', 'application/json')

  if (areCordinatesValid(userLong, userLat)) {
    let query = {
      'location': {
        '$near': [
          userLong, // userLong
          userLat // userLat
        ],
        $maxDistance: 0.020
      },
      'stationValid': {
        '$eq': true
      }
    }

    query.location['$maxDistance'] = (!range.isNaN) ? range * 0.01 : 0.020

    let excluedes = {
      _id: 0,
      stationValid: 0,
      __v: 0
    }

    GasStation.find(query, excluedes)
    .exec((err, locationsData) => {
      // console.log('locationsData', locationsData)
      if (err) res.send(500, { error: err })
      res.send(200, processLocations(locationsData, [userLong, userLat]))
    })
  } else {
    console.log('404')
    res.send(404, {
      error: 'Locacion Invalida'
    })
  }
})

function areCordinatesValid (long, lat) {
  let notNull = (lat != null && long != null) // assert(notNull, 'Locacion Invalida: Valor nulo')
  let notNaN = (!isNaN(lat) && !isNaN(long)) // assert(notNaN, 'Locacion Invalida: Valor no es numerico')
  let validLong = (-180 < long < 180) // assert(validLong, 'Locacion Invalida: Longitud fuera de rango')
  let validLat = (-90 < lat < 90) // assert(validLong, 'Locacion Invalida: latitud fuera de rango')
  return notNull && notNaN && validLong && validLat
}

function processLocations (array, userLoc) {
  // let jsonForReponse = {}
  let max = {
    magna: 0,
    premium: 0,
    diesel: 0
  }

  let resposeArray = array.map((item) => {
    if (item.prices.magna > max.magna) {
      max.magna = item.prices.magna
    }
    if (item.prices.diesel > max.diesel) {
      max.diesel = item.prices.diesel
    }
    if (item.prices.premium > max.premium) {
      max.premium = item.prices.premium
    }

    let newItem = JSON.parse(JSON.stringify(item))

    newItem.location = {
      lat: item.location[1] + '',
      long: item.location[0] + ''
    }

    newItem.distance = getEarthDistance(item.location, userLoc)

    newItem.prices = {
      diesel: item.prices.diesel + '',
      timestamp: item.prices.timestamp + '',
      magna: item.prices.magna + '',
      premium: item.prices.premium + ''
    }

    // console.log(newItem)
    return newItem
  })

  return JSON.stringify({
    maxPrices: max,
    length: resposeArray.length,
    stations: resposeArray
  })
}

function getEarthDistance (a, b) {
  const R = 6378 // 6371000  metros
  let φ1 = toRad(a[1])
  let φ2 = toRad(b[1])
  let Δφ = toRad(b[1] - a[1])
  let Δλ = toRad(b[0] - a[0])

  let x = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  let y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))

  return (R * y).toFixed(3)
}

function toRad (value) {
  return value * Math.PI / 180
}

module.exports = router
