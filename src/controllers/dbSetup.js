var async = require('async')
var mongoose = require('mongoose')
var GasStation = mongoose.model('GasStation')
const fs = require('fs')
var path = require('path')


module.exports = {
  init: function () {
    console.log('DB init')
    // mongoose.connect(process.env.DB_URL, function (err) {
    //   if (err) {
    //     console.log('Error DB', err)
    //     throw err
    //   }
    //
    //   fs.readFile(path.join(__dirname, '../private/gasStatios.json'), 'utf8', function (err, data) {
    //     if (err) throw err;
    //     obj = JSON.parse(data);
    //
    //     GasStation.remove(() => {
    //       async.each(obj, function (item, cb) {
    //         console.log(item.id)
    //         var station = {
    //           _id: parseInt(item.id),
    //           name: item.name,
    //           address: item.address,
    //           satate: item.estado || '',
    //           stationValid: item.status,
    //           prices: {
    //             diesel: 0,
    //             magna: 0,
    //             premium: 0,
    //             timestamp: new Date().toISOString()
    //           }
    //         }
    //
    //         station.location = (item.status) ? [item.location.long, item.location.lat] : [0, 0]
    //
    //         GasStation.create(station, function (error, data) {
    //           if (error) throw error
    //           console.log(data)
    //           cb(error, null)
    //         })
    //       }, function (err) {
    //         if (err) throw err
    //       })
    //     })
    //   });
    // })
  }
}
