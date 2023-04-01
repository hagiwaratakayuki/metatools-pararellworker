const Controller = require('./controller')
const Worker = require('./worker');
const SharedData = require('./sharedData/data');
SharedData.funcs = require('./sharedData/funcs/overwrite')

module.exports = {Controller, Worker, SharedData}
