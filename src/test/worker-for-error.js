const Worker = require('../worker.js')
const testConsts = require('./consts')
const worker = new Worker()

worker.postInit(testConsts.INIT_VALUE)
throw new Error(testConsts.ERROR_MESSAGE)