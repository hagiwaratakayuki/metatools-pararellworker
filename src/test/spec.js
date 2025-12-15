const Controller = require('../controller')
const assert = require('node:assert')
const testConsts = require('./consts')
const { it } = require('node:test')

describe('basic worker test', function () {

    it('should invoke worker and invoke init event', function (done) {
        const controller = new Controller('./src/test/worker.js', 1)
        controller.onInitAll((data) => {
            const initData = data[0]


            assert.equal(testConsts.INIT_VALUE, initData)
            controller.terminate().finally(done)

        })

    })
    it('should invoke return event', function (done) {
        const controller = new Controller('./src/test/worker.js', 1)
        const value = Math.random()
        controller.on(testConsts.RETURN_TEST, (data) => {
            assert.equal(value, data)
            const proms = controller.terminate()
            proms.finally(done)
        })
        controller.onInitAll(function () {
            controller.broadcast(testConsts.RETURN_TEST, value)
        })




    })
    it('should invoke counter event valid', function (done) {
        const controller = new Controller('./src/test/worker.js', 2)
        let countGetCount = 0
        let results = {}
        controller.on(testConsts.COUNT_GET, function (data, id) {

            results[id] = data
            countGetCount += 1
            if (countGetCount == 2) {
                assert(results[0], 2)
                assert(results[1], 1)
                const proms = controller.terminate()
                proms.finally(done)

            }

        })

        controller.onInitAll(function () {


            controller.broadcast(testConsts.COUNTER_TRIGGER)
            controller.broadcast(testConsts.COUNTER_TRIGGER, null, 1)
            controller.broadcast(testConsts.COUNT_GET)
        })




    })


    it('should handle worker termination', function (done) {
        const controller = new Controller('./src/test/worker.js', 2)
        controller.onInitAll(function () {
            controller.terminate().then(function (r) {

                assert(Object.keys(r).length, 2, 'all workers shoud be terminated')
                assert(r[0], 0, 'id 0 should be return 0')
                assert(r[1], 0, 'id 1 should be return 0')


            }).finally(done)
        })
    })

    it('should handle when workerfile not exist', function () {

        try {
            const controller = new Controller('./src/test/worker-not-exist.js', 2)
            assert.fail('controller should throw error when workerfile not exist')
        } catch (error) {
            assert(error instanceof Error, 'controller should throw error when workerfile not exist')



        }




    })

})

