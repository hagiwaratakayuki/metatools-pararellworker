const { Worker } = require('worker_threads')
const path = require('node:path')
const process = require('node:process')
const { EventEmitter } = require('node:events')
const createMessage = require('./message')

const CONSTS = require('./consts')


const cwd = process.cwd()

/**
 * @typedef {import('./message').Message} Message
 */

class Controller extends EventEmitter {
    /**
     * worker controller
     * @param {string | {worker:string, base:string}} workerpath when  string path from app root path. when list, path, from base path 
     * @param {number} workerNumber 
     * @param {any} workerOptions
     * @param {any} emitterOptions
     * @see  https://nodejs.org/api/worker_threads.html#new-workerfilename-options
     * @see  https://nodejs.org/api/events.html#capture-rejections-of-promises
     * 
     */
    constructor(workerpath, workerNumber, workerOptions = {}, emitterOptions = {}) {
        super(emitterOptions)
        /**
         * @type {{number:Worker}}
         */
        this.workers = {}
        this.workerNumber = workerNumber
        this._notInitCount = workerNumber
        this._initResults = {}
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


    }
    /**
     * inner function. bind event dispathcher to worker id 
     * @param {any} id 
     * @returns {(message:any) => void}
     */
    _createOnMessage(id) {

        const func = function (message) {
            this._onMessage(message, id)

        }

        return func.bind(this)

    }
    /**
     * 
     * @param {Message} message 
     * @param {number} id 
     */
    _onMessage(message, id) {
        if (message.eventName === CONSTS.INIT_EVENT) {
            this._notInitCount -= 1
            this._initResults[id] = message.data
            if (this._notInitCount === 0) {
                this.emit(CONSTS.INIT_EVENT, this._initResults)

            }
            return

        }

        this.emit(message.eventName, message.data, id)
    }
    /**
     * fire when all workers post initialized message 
     * @param {(value:any, id:any)=> void} callback 
     */
    onInit(callback) {
        this.on(CONSTS.INIT_EVENT, callback)

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
        const proms = []
        for (const worker of Object.values(this.workers)) {

            proms.push(worker.terminate())

        }

        return Promise.all(proms)
    }


}

module.exports = Controller