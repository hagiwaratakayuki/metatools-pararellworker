const { Worker } = require('node:worker_threads')
const path = require('node:path')
const process = require('node:process')
const { EventEmitter } = require('node:events')
const createMessage = require('./message')

const CONSTS = require('./consts')


const cwd = process.cwd()

class Dispatcher {
    /**
     * @type {any}
     */
    _id

    /**
     * @type {EventEmitter}
     */
    _events

    /**
     * @param {*} id
     * @param {EventEmitter} events  
     */
    constructor(id, events) {
        this._id = id
        this._events = events



    }
    /**
     * 
     * @param {Message} message 
     * @param {number} id 
     */
    dispatch(message, id) {

        this._events.emit(message.eventName, message.data, id)
    }
}

/**
 * @typedef {import('./message').Message} Message
 */

class Controller {
    /**
     * @type {EventEmitter}
     */
    events
    /**
     * @type {typeof Dispatcher}
     */
    _dispatcherClass


    /**
     * worker controller
     * @param {string | {worker:string, base:string}} workerpath when  string path from app root path. when list, path, from base path 
     * @param {number} workerNumber 
     * @param {any} workerOptions
     * @param {any} emitterOptions
     * @param {typeof EventEmitter} eventsClass
     * @param {typeof Dispatcher} dispatcherClass
     * @see  https://nodejs.org/api/worker_threads.html#new-workerfilename-options
     * @see  https://nodejs.org/api/events.html#capture-rejections-of-promises
     * 
     */
    constructor(workerpath, workerNumber, workerOptions = {}, emitterOptions = {}, dispatcherClass = Dispatcher, eventsClass = EventEmitter) {
        super(emitterOptions)
        /**
         * @type {{number:Worker}}
         */
        this.workers = {}
        this.workerNumber = workerNumber
        this._notInitCount = workerNumber
        this._initResults = {}
        this._dispatcherClass = dispatcherClass
        this.events = new eventsClass(emitterOptions)

        let _workerPath
        if (typeof workerpath === 'string' || workerpath instanceof String) {
            _workerPath = path.join(cwd, workerpath)

        }
        else {

            _workerPath = path.join(workerpath.base, workerpath.worker)
        }
        for (let id = 0; id < workerNumber; id++) {
            const worker = new Worker(_workerPath, workerOptions)
            this.workers[id] = worker

            worker.on('message', this._createOnMessage(id))

        }
        this.on(CONSTS.INIT_EVENT, this._handleInitEvent.bind(this))



    }
    on(eventName, callback) {
        this.events.on(eventName, callback)

    }
    /**
     * inner function. bind event dispathcher to worker id 
     * @param {any} id 
     * @returns {(message:any) => void}
     */
    _createOnMessage(id) {

        const dispathcher = new this._dispatcherClass(id, this.events)
        return dispathcher.dispatch.bind(dispathcher)

    }
    _handleInitEvent(message, id) {


        this._notInitCount -= 1
        this._initResults[id] = message.data
        if (this._notInitCount === 0) {
            this.events.emit(CONSTS.INIT_EVENT_ALL, this._initResults)

        }




    }
    /**
     * fire when all workers post initialized message 
     * @param {(value:any, id:any)=> void} callback 
     */
    onInit(callback) {
        this.events.on(CONSTS.INIT_EVENT_ALL, callback)

    }
    createShareEvent(eventName, shareFunc) {

        const func = function (message, id) {
            const shareData = shareFunc(message, id)
            this.broadcast(eventName, shareData)



        }.bind(this)
        this.on(eventName, func)
    }
    /**
     * broadcast all workers
     * @param {string} eventName 
     * @param {any} data 
     * @param {number?} excludeId 
     */
    broadcast(eventName, data, excludeId) {
        const message = createMessage(eventName, data)

        for (const [id, worker] of Object.entries(this.workers)) {
            if (id === excludeId) {
                continue

            }

            worker.postMessage(message)

        }
    }
    /**
     * message for specific worker
     * @param {number} id 
     * @param {string} eventName 
     * @param {any} data 
     */
    postMessage(id, eventName, data) {
        /**
         * @type {Worker}
         */
        const worker = this.workers[id]


        worker.postMessage(createMessage(eventName, data))

    }
    /**
     * terminate all workers
     * 
     */
    terminate() {


        const rootObserver = {

            resolve: null,
            reject: null,
            isRejected: false,
            unterminatedCount: this.workerNumber,
            results: {},
            applyReject: function (id, reason) {
                this.isRejected = true
                this.applyResult(id, reason)

            },
            applyResult: function (id, result) {
                this.results[id] = result
                this.unterminatedCount -= 1
                if (this.unterminatedCount === 0) {
                    if (this.isRejected) {
                        this.reject(this.results)
                    }
                    else {
                        this.resolve(this.results)

                    }


                }

            }

        }

        const promise = new Promise((resolve, reject) => {
            rootObserver.resolve = resolve
            rootObserver.reject = reject

        })


        for (const [id, worker] of Object.entries(this.workers)) {
            const observer = {
                id,
                root: rootObserver,
                applyReject(reason) {
                    this.root.applyReject(this.id, reason)

                },
                applyResult(result) {
                    this.root.applyResult(this.id, result)


                }

            }
            worker.terminate().then(observer.applyResult.bind(observer), observer.applyReject.bind(observer))
        }

        return promise
    }


}

module.exports = Controller