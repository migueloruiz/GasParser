#!/usr/bin/env node

var fs = require('fs')
var parseXlsx = require('excel')
var scrapeIt = require('scrape-it')
var async = require('async')
var request = require('request')
const rootPath = process.cwd()

// Funciones utiles
// ===========================
function scrapXlsx () {
  async.auto({
    scarpArticleUrl: cb => scarpArticleUrl(cb),
    scarpXlsxUrl: ['scarpArticleUrl', (results, cb) => scarpXlsxUrl(results, cb)],
    getXlsxFile: ['scarpXlsxUrl', (results, cb) => getXlsxFile(results, cb)],
    prossesFile: ['getXlsxFile', (results, cb) => prossesFile(results, cb)]
  }, (err, results) => {
    if (err) console.error(err)
  })
};

function scarpArticleUrl (cb) {
  let scrapOtions = {
    articles: {
      listItem: 'article',
      data: {
        title: 'h4',
        link: {selector: 'a', attr: 'href'}
      }
    }
  }

  scrapeIt('https://www.gob.mx/aperturagasolinas', scrapOtions).then(page => {
    var filterArticles = page.articles.filter((item) => {
      return (item.title.search('Precios máximos') !== -1)
    })

    if (filterArticles.length > 0) {
      console.log('Articulo Url: ' + 'https://www.gob.mx' + filterArticles[0].link)
      cb(null, 'https://www.gob.mx' + filterArticles[0].link)
    } else {
      // TODO: enviar mensaje
      cb('Article with "Precios máximos" No Found', null)
    }
  }).catch(err => {
    // TODO: enviar mensaje
    cb('Article Error: ' + err, null)
  })
}

function scarpXlsxUrl (results, cb) {
  let scrapOtions = {
    achors: {
      listItem: 'li',
      data: {
        title: 'a',
        link: {selector: 'a', attr: 'href'}
      }
    }
  }

  scrapeIt(results.scarpArticleUrl, scrapOtions).then(page => {
    var filterAnchors = page.achors.filter((item) => {
      return (item.link && item.link.search('.xlsx') !== -1)
    })

    if (filterAnchors.length > 0) {
      console.log('Xlsx Url: ' + filterAnchors[0].link)
      cb(null, filterAnchors[0].link)
    } else {
      // TODO: enviar mensaje
      cb('Anchor with ".xlsx" No Found', null)
    }
  }).catch(err => {
    // TODO: enviar mensaje
    cb('Archor Erroe: ' + err, null)
  })
}

function getXlsxFile (results, cb) {
  console.log('Descargarndo Xlsx')
  var file = fs.createWriteStream(rootPath + '/src/private/gasolina.xlsx')
  request(results.scarpXlsxUrl).on('response', function (response) {
    if (response.statusCode === 200) {
      response.pipe(file).on('close', function () {
        console.log('Descarga Xlsx Terminada')
        cb(null, null)
      })
    } else {
      console.log('Descargarndo Xlsx2')
      // TODO: enviar mensaje bot
      cb('Descarga de Xlsx Error: ' + response.statusCode, null)
    }
  })
}

function prossesFile (results, cb) {
  console.log('Processando Xlsx')
  parseXlsx(rootPath + '/src/private/gasolina.xlsx', function (err, data) {
    if (err) throw err
    var gasData = getCleanJson(data)
    fs.writeFile(rootPath + '/src/private/gas.json', JSON.stringify(gasData), (err) => {
      if (err) throw err
      console.log('Json Generado')
      cb(null, null)
    })
  })
}

function getCleanJson (array) {
  var orderJson = { estados: {} }
  var lastState = ''

  orderJson.fecha = getDateFrom(array[0][0])

  for (var i = 3; i < array.length; i++) {
    if (isValidRow(array[i])) {
      if (lastState !== array[i][2] && array[i][2] !== '') {
        if (!orderJson.estados.hasOwnProperty(array[i][2])) {
          orderJson.estados[array[i][2]] = {}
        }
        lastState = array[i][2]
      }
      let municipio = array[i][3]
      orderJson.estados[lastState][municipio] = {
        magna: parseFloat(array[i][4]).toFixed(2),
        premium: parseFloat(array[i][5]).toFixed(2),
        diesel: parseFloat(array[i][6]).toFixed(2)
      }
    }
  }

  function getDateFrom (item) {
    let rex = /(\d{1,2})\s?[Aa]?[Ll]?\s?(\d{1,2})?\s\w+\s(\w+)\s\w+?\s(\d{4})[.]?/ig
    let match = rex.exec(item)

    return (match[2]) ? `${match[1]} al ${match[2]} de ${capitalize(match[3])} del ${match[4]}` : `${match[1]} de ${capitalize(match[3])} del ${match[4]}`
  }

  function capitalize (s) {
    return s.toLowerCase().replace(/\b./g, (a) => a.toUpperCase())
  }

  // Se obtine el maximo
  // ========================
  let estadosKeys = Object.keys(orderJson.estados)
  estadosKeys.forEach((estado) => {
    let municipiosKeys = Object.keys(orderJson.estados[estado])

    var maxMagna = 0
    var maxMagnaCity = ''
    municipiosKeys.forEach((municipio) => {
      if (parseFloat(orderJson.estados[estado][municipio].magna) > maxMagna) {
        maxMagna = parseFloat(orderJson.estados[estado][municipio].magna)
        maxMagnaCity = municipio
      }
    })

    orderJson.estados[estado]['MAXIMO EN ESTADO'] = {
      magna: parseFloat(orderJson.estados[estado][maxMagnaCity].magna),
      premium: parseFloat(orderJson.estados[estado][maxMagnaCity].premium),
      diesel: parseFloat(orderJson.estados[estado][maxMagnaCity].diesel)
    }
  })

  // Sort
  // ========================
  orderJson.timestamp = new Date().toISOString()
  return orderJson
}

function isValidRow (row) {
  return row[6] !== '' && row[5] !== '' && row[4] !== ''
}

// RUN
// ========================
scrapXlsx()
