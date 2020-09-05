// Read config
require('dotenv').config()

const express = require('express')
const router = express.Router()

const dataFromBrowserDir = process.env.DATA_FROM_BROWSER_DIR
const geoserverDataDir = process.env.GEOSERVER_DATA_DIR;

// File system
const fs = require('fs')

// Middleware
const jsonParser = require('body-parser').json()
const multer = require('multer')
const uploadParser = multer()



// modules
const AddLocationModule = require('../scripts/add_location')
const AddMapModule = require('../scripts/add_map')
const SetSelectionModule = require('../scripts/set_selection')
const SetResolutionModule = require('../scripts/set_resolution')
const ModuleOne = require('../scripts/module_1')
const ModuleOneA = require('../scripts/module_1a')
const ModuleTwo = require('../scripts/module_2')

const modules = {
  add_location: new AddLocationModule(),
  add_map: new AddMapModule(),
  set_selection: new SetSelectionModule(),
  set_resolution: new SetResolutionModule(),
  module_1: new ModuleOne(),
  module_1a: new ModuleOneA(),
  module_2: new ModuleTwo()
}

// launch a module
router.post('/launch', jsonParser, (req, res, next) => {
  // do some checks first
  if (!dataFromBrowserDir) {
    throw new Error("Cannot launch module: DATA_FROM_BROWSER_DIR is not defined.")
  }
  if (!geoserverDataDir) {
    throw new Error("Cannot launch module: GEOSERVER_DATA_DIR is not defined.")
  }

  try {
    res.send(modules[req.body.launch].launch())
  } catch (err) {
    next(err)
  }
})

// message request
router.post('/reply', jsonParser, (req, res, next) => {
  try {
    const module = modules[req.query.message_id.split('.')[0]]
    const message = module.process(req.body.msg, req.query.message_id)

    if (message) {
      res.send(message)
    } else {
      next("Something went wrong")
    }
  } catch (err) {
    next(err)
  }
})

// file upload
router.post('/file', uploadParser.single('file'), (req, res, next) => {
  try {
    const module = modules[req.query.message_id.split('.')[0]]
    const file = `${dataFromBrowserDir}/${req.file.originalname}`
    const writer = fs.createWriteStream(file)

    writer.write(req.file.buffer, (error) => {
      if (error) {
        next(error)
      }
      writer.close()

      // Process file after it's finished downloading.
      // Have to add another try/catch block, as we're inside an async function
      try {
        const message = module.process(file, req.query.message_id)

        if (message) {
          res.send(message)
        } else {
          next("Something went wrong")
        }
      } catch (err) {
        next(err)
      }
    })
  } catch (err) {
    next(err)
  }
})

// send a GeoJSON
router.post('/drawing', jsonParser, (req, res, next) => {
  try {
    const module = modules[req.query.message_id.split('.')[0]]
    const file = `${dataFromBrowserDir}/drawing.geojson`

    fs.writeFileSync(file, JSON.stringify(req.body.data))
    res.send(module.process(file, req.query.message_id))
  } catch (err) {
    next(err)
  }
})

// return all output filenames
router.post('/output', jsonParser, (req, res, next) => {
  try {
    const list = []
    fs.readdirSync('/root/cityapp/output').forEach(file => {
      list.push(file)
    });
    const message = { message_id: 'output', message: { list } }
    res.send(message)
  } catch (err) {
    next(err)
  }
})

// error handler
router.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err)
  }
  res.status(500)
  res.json({ message: err.message && err.message.split('\n')[0] || err })
})

module.exports = router