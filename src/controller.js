const { Worker } = require('node:worker_threads')
const { accessSync, constants: fsConstants } = require('node:fs')
const path = require('node:path')
const process = require('node:process')
const { fileURLToPath, pathToFileURL } = require('node:url')


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
     *
     */
    messageDispatch(message, id) {


        this._events.emit(message.eventName, message.data, this._id)
    }

}

class WorkerEventHandler {
    /**
     * @type {any}
     */
    _id
    /**
     * @type {EventEmitter}
     */
    _events

    /**
     * @type {Worker}
     */
    _worker
    /**
     * @type {string}
     */
    _eventName


    /**
     * 
     * @param {*} id 
     * @param {EventEmitter} events 
     * @param {string} eventName 
     *  
     */

    constructor(id, worker, events, eventName) {
        this._id = id
        this._events = events
        this._worker = worker
        this._eventName = eventName
        const handleEvent = this.handleEvent.bind(this)
        this._worker.on(eventName, handleEvent)



    }
    handleEvent(...args) {

        this._events.emit(this._eventName, this._id, this._worker, ...args)






    }
}


/**
 * @typedef {'messageerror'| 'online'| 'error'|'exit'} DefaultSupportedWorkerEvents
 * @type {DefaultSupportedWorkerEvents[]}
 */
const WORKER_EVENT_NAMES = ['messageerror', 'online', 'error', 'exit']


function TEMPORARY_WORKER_ERROR_HANDLER(param) {
    if (param instanceof Error && param.message) {
        console.log(param.message)
        if ('stack' in param) {
            console.log(param.stack)
        }

    }
    else if (typeof param !== 'number' && typeof param !== 'undefined' && param !== null) {
        console.log(param)
    }

}
const CASH_WORKER_EXIST = {}
/**
 * @typedef {import('./message').Message} Message
 */

class Controller {
    /**
     * @type {EventEmitter}
     */
    messageEvents
    /**
     * @type {EventEmitter}
     */
    workerEvents
    /**
     * @type {typeof Dispatcher}
     */
    _dispatcherClass

    /**
     * @type {typeof WorkerEventHandler}
     */
    _workerEventHandlerClass

    /**
     * @type {boolean}
     */
    _isTemporayWorkerErrorRemoved

    /**
     * @type {Map<number,Worker>}
     */
    workers

    /**
     * worker controller
     * @param {string | {worker:string, base:string}} workerpath when  string path from app root path. when list, path, from base path 
     * @param {number} workerNumber 
     * @param {any} workerOptions
     * @param {any} emitterOptions
     * @param {typeof EventEmitter} [workerEmitterClass=EventEmitter] 
     * @param {typeof WorkerEventHandler} [workerEventHandlerCalss=WorkerEventHandler] 
     * @param {any} [workerEmitterOptions={}] 
     * @param {typeof EventEmitter} emitterClass
     * @param {typeof Dispatcher} dispatcherClass
     * @see  https://nodejs.org/api/worker_threads.html#new-workerfilename-options
     * @see  https://nodejs.org/api/events.html#capture-rejections-of-promises
     * 
     */
    constructor(workerpath, workerNumber, workerErrorHandler = TEMPORARY_WORKER_ERROR_HANDLER, workerOptions = {}, emitterOptions = {}, workerEmitterOptions = {}, dispatcherClass = Dispatcher, workerEventHandlerCalss = WorkerEventHandler, emitterClass = EventEmitter, workerEmitterClass = EventEmitter) {


        this.workers = new Map()
        this.workerNumber = workerNumber
        this._notInitCount = workerNumber
        this._initResults = {}
        this._dispatcherClass = dispatcherClass
        this._workerEventHandlerClass = workerEventHandlerCalss
        this.messageEvents = new emitterClass(emitterOptions)

        // worker events
        this.workerEvents = new workerEmitterClass(workerEmitterOptions)
        this._isTemporayWorkerErrorRemoved = workerErrorHandler !== TEMPORARY_WORKER_ERROR_HANDLER
        this.workerEvents.on('error', workerErrorHandler)

        let _workerPath
        if (typeof workerpath === 'string' || workerpath instanceof String) {

            _workerPath = path.resolve(workerpath)


        }
        else {

            _workerPath = path.join(workerpath.base, workerpath.worker)
        }
        if (_workerPath in CASH_WORKER_EXIST === true && CASH_WORKER_EXIST[_workerPath] !== true) {
            throw CASH_WORKER_EXIST[_workerPath]

        }
        else {
            try {
                accessSync(_workerPath, fsConstants.X_OK | fsConstants.R_OK)
            }
            catch (error) {
                CASH_WORKER_EXIST[_workerPath] = error
                throw error
            }
        }
        const workerUrl = pathToFileURL(_workerPath)
        for (let id = 0; id < workerNumber; id++) {

            let worker

            worker = new Worker(workerUrl, workerOptions)

            this.workers.set(id, worker)
            // event dispatch
            worker.on('message', this._createOnMessage(id))

            for (const eventName of WORKER_EVENT_NAMES) {
                new this._workerEventHandlerClass(id, worker, this.workerEvents, eventName)
            }

            this.workerEvents.on('error', workerErrorHandler)


        }
        this.on(CONSTS.INIT_EVENT, this._handleInitEvent.bind(this))



    }
    on(eventName, callback) {
        this.messageEvents.on(eventName, callback)

    }
    /**
     * 
     * @param {DefaultSupportedWorkerEvents} eventName 
     * @param {Function} callback 
     */
    onWorkerEvent(eventName, callback) {
        if (eventName === 'error' && this._isTemporayWorkerErrorRemoved === false) {
            this.workerEvents.removeListener('error', TEMPORARY_WORKER_ERROR_HANDLER)

        }
        this.workerEvents.on(eventName, callback)

    }
    /**
     * inner function. bind event dispathcher to worker id 
     * @param {any} id 
     * @returns {(message:any) => void}
     */
    _createOnMessage(id) {

        const dispathcher = new this._dispatcherClass(id, this.messageEvents)
        return dispathcher.messageDispatch.bind(dispathcher)

    }
    _handleInitEvent(message, id) {


        this._notInitCount -= 1
        this._initResults[id] = message
        this.messageEvents.emit(CONSTS.INIT_EVENT_SINGLE, message, id)
        if (this._notInitCount === 0) {
            this.messageEvents.emit(CONSTS.INIT_EVENT_ALL, this._initResults)

        }




    }
    /**
     * fire when all workers post initialized message 
     * @param {(value:any, id:any)=> void} callback 
     */
    onInitAll(callback) {
        this.messageEvents.on(CONSTS.INIT_EVENT_ALL, callback)

    }
    /**
     * fire when single workers post initialized message 
     * @param {(value:any, id:any)=> void} callback 
     */
    onInit(callback) {
        this.messageEvents.on(CONSTS.INIT_EVENT_SINGLE, callback)

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

        for (const [id, worker] of this.workers) {
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
        const worker = this.workers.get(id)



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

        const promise = new Promise(function (resolve, reject) {
            rootObserver.resolve = resolve
            rootObserver.reject = reject

        })


        for (const [id, worker] of this.workers) {
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