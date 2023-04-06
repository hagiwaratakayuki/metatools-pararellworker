import module from "module";
const require = module.createRequire(import.meta.url)
const namespace = require('./index.cjs');
/**
 * @typedef {import("./controller.js")} Controller
 * @typedef {import("./worker.js")} Worker
 * @typedef {import("./sharedData")} SharedData
 */
/**
 * @type {Controller}
 */
export const Controller = require('./controller')
/**
 * @type {Worker}
 */
export const Worker = require('./worker');

/**
 * @type {SharedData}
 */
export const SharedData = require('./sharedData/data');


/**
 * @type {{Controller:Controller, Worker:Worker, SharedData:SharedData}}
 * */
export default namespace = {Controller, Worker, SharedData}