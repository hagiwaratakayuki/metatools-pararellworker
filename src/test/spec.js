const Controller = require('../controller');
const assert = require('node:assert');
const testConsts = require('./consts');

describe('basic worker test', function () {

    it('should invoke worker and invoke init event', function (done) {
        const controller = new Controller('/src/test/worker.js', 1);
        controller.onInit((data) =>{
            const initData = data[0];
            
            assert.equal(testConsts.INIT_VALUE, initData);
            const proms = controller.terminate();
            proms.finally(done)
            
        })
       
    });
    it('should invoke return event', function (done) {
        const controller = new Controller('/src/test/worker.js', 1);
        const value = Math.random();
        controller.on(testConsts.RETURN_TEST, (data) => {
            assert.equal(value, data);
            const proms = controller.terminate();
            proms.finally(done);
        });
        controller.onInit(function(){
            controller.broadcast(testConsts.RETURN_TEST, value);
        })
       
       


    });
    it('should invoke counter event valid', function (done) {
        const controller = new Controller('/src/test/worker.js', 2);
        let countGetCount = 0;
        let results  = {};
        controller.on(testConsts.COUNT_GET, function(data, id){
            
            results[id] = data;
            countGetCount += 1;
            if (countGetCount == 2) {
                assert(results[0], 2)
                assert(results[1], 1)
                const proms = controller.terminate();
                proms.finally(done);

            }

        })
      
        controller.onInit(function () {
          
           
            controller.broadcast(testConsts.COUNTER_TRIGGER);
            controller.message(0, testConsts.COUNTER_TRIGGER);
            controller.broadcast(testConsts.COUNT_GET);
        })




    });


});