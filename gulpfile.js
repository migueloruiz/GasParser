const gulp = require('gulp');
const http = require('http');
const fs = require('fs');
const parseXlsx = require('excel');
const scrapeIt = require("scrape-it");
const async = require('async');

var inside = require('point-in-polygon');
var jeditor = require('gulp-json-editor');



gulp.task('json', function(callback) {
  gulp.src("./gasStatios.json")
    .pipe(jeditor(function(json) {

      json.forEach((item,index) => {
        delete json[index]['location']['logn'];
      })

      return json
    }))
    .pipe(gulp.dest("./"));
});


function editSattios(json) {
  return json.places.place
}


gulp.task('setSatate', function(callback) {
  var states = require('./src/private/states.json');

  gulp.src("./src/private/gasStatios.json")
    .pipe(jeditor(function(json) {
      let estadosKeys = Object.keys(states)
      var count = 0;

      json.forEach((item, index) => {
        var stationLocation = [item.location.long,item.location.lat]
        for (var i = 0; i < estadosKeys.length; i++) {
          var polygon = states[estadosKeys[i]];
          if (inside(stationLocation, polygon)) {
            json[index].status = true
            json[index].estado = estadosKeys[i]
            console.log(json[index].status)
            return;
          }

          if (i == estadosKeys.length - 1  ) {
            json[index].status = false
            count ++;
            console.log('=========================')
            console.log('ID', item.id)
            console.log('Nombre', item.name)
            console.log('direccion', item.address)
            console.log('Locacion', stationLocation)
          }
        }
      })
      console.log('Gasolinerias con locacciones erroneas: ', count);
      return json
    }))
    .pipe(gulp.dest("./src/private/"));

});

// Funciones utiles
// ===========================
gulp.task('scrapXlsx', function(callback) {
  async.auto({
    scarpArticleUrl: cb => scarpArticleUrl(cb),
    scarpXlsxUrl: ['scarpArticleUrl', (results, cb) => scarpXlsxUrl (results, cb)],
    getXlsxFile: ['scarpXlsxUrl', (results, cb) => getXlsxFile (results, cb)],
    prossesFile: ['getXlsxFile', (results, cb) => prossesFile (results, cb)]
  }, (err, results) => {
    if (err) console.error(err)
    console.log('acabo')
  })
});

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
    var filterArticles = page.articles.filter((item) =>{
      return (item.title.search('Precios máximos') != -1) ? true : false
    })

    if (filterArticles.length > 0 ) {
      console.log('Articulo Url: '+ 'https://www.gob.mx' + filterArticles[0].link)
      cb(null, 'https://www.gob.mx'+filterArticles[0].link)
    } else {
      // TODO: enviar mensaje
      cb('Article with "Precios máximos" No Found', null)
    }
  }).catch( err => {
    // TODO: enviar mensaje
    cb('Article Error: '+ err, null)
  });
}

function scarpXlsxUrl (results, cb) {
  let scrapOtions = {
    achors: {
      listItem: 'li',
      data: {
        title: 'a',
        link: { selector: 'a', attr: 'href'}
      }
    }
  }

  scrapeIt(results.scarpArticleUrl, scrapOtions).then(page => {
      var filterAnchors = page.achors.filter((item) =>{
        return (item.link && item.link.search('.xlsx') != -1) ? true : false
      })

      if (filterAnchors.length > 0) {
        console.log('Xlsx Url: '+ filterAnchors[0].link)
        cb(null, filterAnchors[0].link)
      } else {
        // TODO: enviar mensaje
        cb('Anchor with ".xlsx" No Found', null)
      }
  }).catch( err => {
    // TODO: enviar mensaje
    cb('Archor Erroe: '+ err, null)
  });
}

function getXlsxFile (results, cb) {
  console.log('Descargarndo Xlsx')
  var file = fs.createWriteStream('./src/private/gasolina.xlsx');
  var request = http.get(results.scarpXlsxUrl, (response) => {
    if (response.statusCode === 200) {
      response.pipe(file).on('close', function(){
        console.log('Descarga Xlsx Terminada')
        cb(null, null)
      });
    } else {
      // TODO: enviar mensaje
      cb('Descarga de Xlsx Error: '+ response.statusCode, null)
    }
  });
}

function prossesFile (results, cb) {
  console.log('Processando Xlsx')
  parseXlsx('./src/private/gasolina.xlsx', function(err, data) {
    if(err) throw err
    var gasData = getCleanJson( data )

    // TODO: Actualizar la base de datos aqui

    fs.writeFile('./src/public/gas.json',JSON.stringify(gasData) , function(err){
      if(err) throw err
      console.log('Json Generado')
      cb(null, null)
    })
  });
}

function getCleanJson( array ){
  var orderJson = { estados: {} }
  var lastState = '';
  for (var i = 3; i < array.length; i++) {
    if ( isValidRow( array[i] ) ){
      if (lastState !== array[i][2] && array[i][2] !== ''){
        if( !orderJson.estados.hasOwnProperty(array[i][2]) ){
          orderJson.estados[array[i][2]] = {}
        }
        lastState = array[i][2]
      }
      let municipio = array[i][3];
      orderJson.estados[lastState][municipio] = {
        magna: parseFloat(array[i][4]).toFixed(2),
        premium: parseFloat(array[i][5]).toFixed(2),
        diesel: parseFloat(array[i][6]).toFixed(2)
      }
    }
  }

  // Se obtine el maximo
  // ========================
  // ========================
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

      orderJson.estados[estado].maximo = {
        magna: parseFloat(orderJson.estados[estado][maxMagnaCity].magna),
        premium: parseFloat(orderJson.estados[estado][maxMagnaCity].premium),
        diesel: parseFloat(orderJson.estados[estado][maxMagnaCity].diesel)
      }

    })

    orderJson.timestamp = new Date().toISOString();
    // ========================
    // ========================
    // ========================

  return orderJson
}

function isValidRow( row ){
  return  row[6] !== '' &&  row[5] !== '' &&  row[4] !== ''
}
