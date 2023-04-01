const { Worker } = require('worker_threads')
const path = require('node:path');
const process = require('node:process')
const { EventEmitter } = require('node:events')
const createMessage = require('./message');

const CONSTS = require('./consts');


const cwd  = process.cwd();

/**
 * @typedef {import('./message').Message} Message
 */

class Controller extends EventEmitter  {
    /**
     * wokerpath accept string absolute path or '/' started path from app root path
     * @param {string} workerpath 
     * @param {number} workerNumber 
     * @param {any} workerData;
     * @param {any} options
     * @see  https://nodejs.org/api/worker_threads.html#new-workerfilename-options
     * 
     */
    constructor (workerpath, workerNumber, workerData, options={}) {
        super(options);
        /**
         * @type {{number:Worker}}
         */
        this.workers = {};
        this.workerNumber = workerNumber;
        this._notInitCount = workerNumber;
        this._initResults = {};
        let _workerPath = workerpath;
        if (workerpath.indexOf('/') === 0) {
            _workerPath = path.join(cwd,workerpath);

        }
        for (let id = 0; id < workerNumber; id++) {
            const worker = new Worker(_workerPath, options)
            this.workers[id] = worker;
        
            worker.on('message', this._createOnMessage(id))
            
        }


    }
    _createOnMessage (id) {

        const func = function (message) {
            this._onMessage(message, id);

        }
        
        return func.bind(this);

    }
    /**
     * 
     * @param {Message} message 
     * @param {number} id 
     */
    _onMessage(message, id){
        if (message.key === CONSTS.INIT_EVENT) {
            this._notInitCount -= 1;
            this._initResults[id] = message.data
            if (this._notInitCount === 0) {
                this.emit(CONSTS.INIT_EVENT,this._initResults);

            }
            return;

        }

       this.emit(message.key, message.data, id);
    }

    onInit(callback) {
        this.on(CONSTS.INIT_EVENT, callback)

    }
    createShareEvent(eventName, shareFunc) {
        const func = function (message, id) {
            const shareData = shareFunc(message, id);
            this.broadcast(eventName, shareData);
        


        }.bind(this);
        this.on(eventName, func);
    }
    /**
     * 
     * @param {string} eventName 
     * @param {any} data 
     * @param {number?} excludeId 
     */
    broadcast(eventName, data, excludeId) {
        const message = createMessage(eventName, data)
        
        for (const [id, worker] of Object.entries(this.workers)) {
                if (id === excludeId) {
                    continue;

                }
                
                worker.postMessage(message);

        }
    }
    /**
     * 
     * @param {number} id 
     * @param {string} eventName 
     * @param {any} data 
     */
    message(id, eventName,data) {
        /**
         * @type {Worker}
         */
        const worker = this.workers[id];
      
        worker.postMessage(createMessage(eventName, data))
        
    }
    terminate(){
        const proms = []
        for (const worker of Object.values(this.workers)) {
            
           proms.push(worker.terminate())

        }
     
        return Promise.all(proms);
    }


}

module.exports = Controller