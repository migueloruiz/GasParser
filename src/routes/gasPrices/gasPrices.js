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
      let keys = Object.keys(prices.estados);
      res.status(200)
      .send(JSON.stringify(keys))
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
      let keys = Object.keys(prices.estados[state]);
      res.status(200)
      .send(JSON.stringify(keys))
    } else {
      res.status(404)
      .send({error: `Estado no valido: ${state}`})
    }
  });

})

router.get('/:state/:city', function (req, res, next) {
  let state = req.params.state
  let city = req.params.city
  res.setHeader('Content-Type', 'application/json');

  fs.readFile(appRoot + '/src/private/gas.json', 'utf8', function (err, fileData) {
    if (err) {
      res.status(500)
      .send({error: `Error al buscar archivo`})
    }

    var prices = JSON.parse(fileData);
    if (prices.estados.hasOwnProperty(state)) {
      if (prices.estados[state].hasOwnProperty(city)) {
        res.status(200)
        .send(JSON.stringify(prices.estados[state][city]))
      } else {
        res.status(404)
        .send({error: `Ciudad no valida: ${city}`})
      }
    } else {
      res.status(404)
      .send({error: `Estado no valido: ${state}`})
    }
  });

})

module.exports = router
