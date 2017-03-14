var mongoose = require('mongoose')
var Schema = mongoose.Schema

var GasStation = function () {
  var GasStationSchema = new Schema({
    _id: { type: Number, required: true, unique: true },
    name: String,
    address: String,
    satate: String,
    stationValid: Boolean,
    location: {
      type: [Number],   // ``<longitude> , <latitude> ]
      index: '2d'       // geospatial index
    },
    prices: {
      diesel: Number,
      magna: Number,
      premium: Number,
      timestamp: String
    }
  })

  mongoose.model('GasStation', GasStationSchema)
}

module.exports = GasStation
