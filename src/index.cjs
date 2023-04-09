/**
 * @typedef {import("./controller.js")} Controller
 * @typedef {import("./worker.js")} Worker
 * @typedef {import("./sharedData")} SharedData
 */

/**
 * @type {Controller}
 */
const Controller = require('./controller')
/**
 * @type {Worker}
 */
const Worker = require('./worker');

/**
 * @type {SharedData}
 */
const SharedData = require('./sharedData/data');


module.exports = {Controller, Worker, SharedData}
