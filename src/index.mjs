import module from "module";
const require = module.createRequire(import.meta.url)
const namespace = require('./index.cjs');
export const { Controller, Worker, SharedData } = namespace
export default namespace 