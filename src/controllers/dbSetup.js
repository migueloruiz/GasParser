var async = require('async')
var mongoose = require('mongoose')
var GasStation = mongoose.model('GasStation')
const fs = require('fs')
var path = require('path')
const https = require('https');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();


module.exports = {
  init: function () {
    conectDB()
  }
}

function conectDB() {
  mongoose.connect(process.env.DB_URL, function (err) {
    if (err) {
      console.log('Error DB', err)
      throw err
    }
    console.log('DB Ready')
  })
}

function getGasStations() {
  mongoose.connect(process.env.DB_URL, function (err) {
    if (err) {
      console.log('Error DB', err)
      throw err
    }

    fs.readFile(path.join(__dirname, '../private/gasStatios.json'), 'utf8', function (err, data) {
      if (err) throw err;
      obj = JSON.parse(data);

      GasStation.remove(() => {
        async.each(obj, function (item, cb) {
          console.log(item.id)
          var station = {
            _id: parseInt(item.id),
            name: item.name,
            address: item.address,
            satate: item.estado || '',
            stationValid: item.status,
            prices: {
              diesel: 0,
              magna: 0,
              premium: 0,
              timestamp: new Date().toISOString()
            }
          }

          station.location = (item.status) ? [item.location.long, item.location.lat] : [0, 0]

          GasStation.create(station, function (error, data) {
            if (error) throw error
            console.log(data)
            cb(error, null)
          })
        }, function (err) {
          if (err) throw err
        })
      })
    });
  })
}

function getUpdateGasProces() {
  async.auto({
    getjson: cb => {
      var data = '';
      https.get('https://datos.gob.mx/api/gasolina/prices.xml', function(res) {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          res.on('data', function(data_) { data += data_.toString(); });
          res.on('end', function() {
            parser.parseString(data, function(err, result) {
              if (err) console.log('Got error: ' + err.message);
              cb(null,result)
            });
          });
        }
      });
    },
    cleanJson: ['getjson', (results, cb) => {
      cb(null,gasPreicesJson(results.getjson))
    }],
  }, (err, results) => {
    if (err) console.error(err)
    mongoose.connect(process.env.DB_URL, function (err) {
      if (err) {
        console.log('Error DB', err)
        throw err
      }

      results.cleanJson.places.forEach((item) => {
        GasStation.findByIdAndUpdate(item.id, {
          prices: item.prices
        }, (err, data) => {
          if (err) console.log('error ', err)
        })
      })

    })
  })
}

function gasPreicesJson(json) {
  var tempJSON = {
    places:[]
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
            break;
          case 'premium':
            tempPrices.premium = parseFloat(gasPrice._)
            break;
          case 'diesel':
            tempPrices.diesel = parseFloat(gasPrice._)
            break;
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
  });

  return tempJSON
}
