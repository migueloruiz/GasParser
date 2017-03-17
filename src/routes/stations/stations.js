var express = require('express')
var mongoose = require('mongoose')
var GasStation = mongoose.model('GasStation')
var router = express.Router()
const assert = require('assert')

router.get('/', function (req, res, next) {
  let userLat = parseFloat(req.query.user_lat)
  let userLong = parseFloat(req.query.user_long)
  res.setHeader('Content-Type', 'application/json');

  if ( areCordinatesValid(userLong, userLat) ){

    let query = {
      'location': {
          '$near': [
              -99.2047001,
              19.4406926
          ]
      },
      'stationValid': {
          '$eq': true
      }
    }

    let excluedes = {
      _id: 0,
      stationValid: 0,
      __v: 0
    }

    GasStation.find(query, excluedes)
    .limit(25)
    .exec((err, locationsData) => {
      console.log('locationsData', locationsData)
      if (err) res.send(500,{ error: err })
      res.send(200, processLocations(locationsData))
    })
  } else {
    console.log('404')
    res.send(404,{
      error: 'Locacion Invalida'
    });
  }
})

function areCordinatesValid(long, lat) {
  let notNull = (lat != null && long != null)// assert(notNull, 'Locacion Invalida: Valor nulo')
  let notNaN = (!isNaN(lat) && !isNaN(long))// assert(notNaN, 'Locacion Invalida: Valor no es numerico')
  let validLong = (-180 < long < 180)// assert(validLong, 'Locacion Invalida: Longitud fuera de rango')
  let validLat = (-90 < lat < 90)// assert(validLong, 'Locacion Invalida: latitud fuera de rango')
  return notNull && notNaN && validLong && validLat
}

function processLocations(array) {
  let jsonForReponse = {}
  let max = {
    magna: 0,
    premium: 0,
    diesel: 0
  }

  array.forEach((item) => {
    if (item.prices.magna > max.magna) {
      max.magna = item.prices.magna
    }
    if (item.prices.diesel > max.diesel) {
      max.diesel = item.prices.diesel
    }
    if (item.prices.premium > max.premium) {
      max.premium = item.prices.premium
    }
  })

  return JSON.stringify({
    maxPrices: max,
    stations: array
  })

}

module.exports = router
