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
    messageDispatch(message, id) {

        this._events.emit(message.eventName, message.data, id)
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

        this._events.emit(this._eventName, this._id, this._worker, ..._args)

    }
}

const WORKER_EVENT_NAMES = ['messageerror', 'online', 'error', 'exit']


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
    constructor(workerpath, workerNumber, workerOptions = {}, emitterOptions = {}, workerEmitterOptions = {}, dispatcherClass = Dispatcher, workerEventHandlerCalss = WorkerEventHandler, emitterClass = EventEmitter, workerEmitterClass = EventEmitter) {

        /**
         * @type {{number:Worker}}
         */
        this.workers = {}
        this.workerNumber = workerNumber
        this._notInitCount = workerNumber
        this._initResults = {}
        this._dispatcherClass = dispatcherClass
        this._workerEventHandlerClass = workerEventHandlerCalss
        this.messageEvents = new emitterClass(emitterOptions)
        this.workerEvents = new workerEmitterClass(workerEmitterOptions)

        let _workerPath
        if (typeof workerpath === 'string' || workerpath instanceof String) {
            _workerPath = path.join(cwd, workerpath)

        }
        else {

            _workerPath = path.join(workerpath.base, workerpath.worker)
        }

        for (let id = 0; id < workerNumber; id++) {
            // try...catchでワーカー生成時のエラーを捕捉
            let worker
            try {
                worker = new Worker(_workerPath, workerOptions)
            } catch (error) {

                throw new Error(`Failed to create worker #${id}: ${error.message}`)
            }
            this.workers[id] = worker
            // event dispatch
            worker.on('message', this._createOnMessage(id))
            for (const eventName of WORKER_EVENT_NAMES) {
                worker.on(eventName, new this._workerEventHandlerClass(id, worker, this.workerEvents, eventName))
            }

        }
        this.on(CONSTS.INIT_EVENT, this._handleInitEvent.bind(this))



    }
    on(eventName, callback) {
        this.messageEvents.on(eventName, callback)

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
        this._initResults[id] = message.data
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

    }/**
     * fire when all workers post initialized message 
     * @param {(value:any, id:any)=> void} callback 
     */
    onInit(callback) {
        this.messageEvents.on(CONSTS.INIT_EVENT, callback)

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

        const promise = new Promise(function (resolve, reject) {
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