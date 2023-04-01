const process = require('node:process')
const WorkerCls = require('../worker');
const testConsts = require('./consts');
const { parentPort, workerData } = require('worker_threads');

const worker = new WorkerCls();

let count = 0;
worker.postInit(testConsts.INIT_VALUE);
worker.on(testConsts.RETURN_TEST, function(message){
    
    worker.postMessage(testConsts.RETURN_TEST, message);

})

worker.on(testConsts.COUNTER_TRIGGER, function () {
   
    count += 1;

})
worker.on(testConsts.COUNT_GET, function () {
    
    worker.postMessage(testConsts.COUNT_GET, count)

})


