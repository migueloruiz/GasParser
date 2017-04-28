#!/usr/bin/env node

var async = require('async')
var mongoose = require('mongoose')
var gasStationModel = require('../src/models/gasStation')()
var GasStation = mongoose.model('GasStation')
const https = require('https')
var xml2js = require('xml2js')
var parser = new xml2js.Parser()

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
  DB_URL: str()
})

function getUpdateGasPrices () {
  console.log('Start getUpdateGasPrices')
  async.auto({
    getjson: cb => {
      console.log('Download Prices.xml')
      var data = ''
      https.get('https://datos.gob.mx/api/gasolina/prices.xml', function (res) {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          res.on('data', function (data_) { data += data_.toString() })
          res.on('end', function () {
            console.log('Proseesing Prices.xml')
            parser.parseString(data, function (err, result) {
              if (err) console.log('Got error: ' + err.message)
              console.log('Prices.json Generated')
              cb(null, result)
            })
          })
        }
      })
    },
    cleanJson: ['getjson', (results, cb) => {
      cb(null, gasPreicesJson(results.getjson))
    }]
  }, (err, results) => {
    if (err) console.error(err)
    console.log('Conecting DB')
    mongoose.connect(process.env.DB_URL, function (err) {
      if (err) {
        console.log('Error DB', err)
        throw err
      }

      console.log('Update Prices in DB')
      async.forEachOf(results.cleanJson.places, (item, key, cb) => {
        GasStation.findByIdAndUpdate(item.id, {
          prices: item.prices
        }, (err, data) => {
          if (err) {
            console.log('error ', err)
            cb(err)
          }
          cb()
        })
      }, function (err) {
        if (err) console.error(err.message)
        console.log('Close Conection DB')
        mongoose.connection.close()
      })
    })
  })
}

function gasPreicesJson (json) {
  console.log('Proseesing Prices.json')

  var tempJSON = {
    places: []
  }
  json.places.place.forEach((item) => {
    let tempPrices = {
      magna: 0,
      premium: 0,
      diesel: 0
    }

    if (item.hasOwnProperty('gas_price')) {
      item['gas_price'].forEach((gasPrice) => {
        switch (gasPrice.$.type) {
          case 'regular':
            tempPrices.magna = parseFloat(gasPrice._)
            break
          case 'premium':
            tempPrices.premium = parseFloat(gasPrice._)
            break
          case 'diesel':
            tempPrices.diesel = parseFloat(gasPrice._)
            break
        }
      })
    }

    tempJSON.places.push({
      id: item.$.place_id,
      prices: {
        diesel: tempPrices.magna,
        magna: tempPrices.premium,
        premium: tempPrices.diesel,
        timestamp: item.hasOwnProperty('gas_price') ? item['gas_price'][0].$.update_time : new Date().toISOString()
      }
    })
  })

  console.log('End Proseesing Prices.json')
  return tempJSON
}

// Run
// =================
getUpdateGasPrices()
