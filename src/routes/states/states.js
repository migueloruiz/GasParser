var express = require('express')
var router = express.Router()
const fs = require('fs')
var path = require('path')

router.get('/', function (req, res, next) {
  res.setHeader('Content-Type', 'application/json');

  fs.readFile(appRoot + '/src/private/gas.json', 'utf8', function (err, fileData) {
    if (err) {
      res.status(500)
      .send({error: `Error al buscar archivo`})
    }

    var prices = JSON.parse(fileData);

    try {
      let keys = _getKeys(prices.estados);
      res.status(200)
      .send(JSON.stringify({
        estados: keys
      }))
    } catch (err) {
      res.status(500)
      .send({error: `Error al buscar archivo`})
    }

  });

})

router.get('/:state', function (req, res, next) {
  let state = req.params.state
  res.setHeader('Content-Type', 'application/json');

  fs.readFile(appRoot + '/src/private/gas.json', 'utf8', function (err, fileData) {
    if (err) {
      res.status(500)
      .send({error: `Error al buscar archivo`})
    }

    var prices = JSON.parse(fileData);
    if (prices.estados.hasOwnProperty(state)) {
      let keys = _getKeys(prices.estados[state])
      let max = prices.estados[state]['MAXIMO']
      res.status(200)
      .send(JSON.stringify({
        ciudades: keys
      }))
    } else {
      res.status(404)
      .send({error: `Estado no valido: ${state}`})
    }
  });

})

module.exports = router

function _getKeys (array) {
  return Object.keys(array).sort((a, b) => {
    if(a < b) return -1
    if(a > b) return 1
    return 0
  });
}
