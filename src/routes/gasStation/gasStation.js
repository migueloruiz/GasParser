var express = require('express')
var router = express.Router()

router.get('/', function (req, res, next) {
  let userLat = req.query.user_lat
  let userLong = req.query.user_long
  res.setHeader('Content-Type', 'application/json');

  if (userLat != null && userLong != null){
    res.send(200,{
      userLat: userLat,
      userLong: userLong
    });
  } else {
    res.send(404,{
      error: 'Locacion Invalida'
    });
    res.sendStatus(404)
  }
})

module.exports = router
