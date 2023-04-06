import module from "module";
const require = module.createRequire(import.meta.url)
const namespace = require('./index.cjs');

export const Controller = require('./controller')
export const Worker = require('./worker');
export const SharedData = require('./sharedData/data');
SharedData.funcs = require('./sharedData/funcs/overwrite')

export default namespace 