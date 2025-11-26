const CONSTS = require('./consts')
const { parentPort, workerData } = require('node:worker_threads');
const { EventEmitter } = require('node:events')
const createMessage = require('./message');

class Worker extends EventEmitter {
    /**
     * @param {any} options
     * @param {any} emitterOptions 
     */
    constructor(emitterOptions = {}) {
        super(emitterOptions)

        this._handler = this._handler.bind(this);
        parentPort.on('message', this._handler);

    }
    getWokerData() {
        return workerData;
    }
    /**
     * report initialize process done
     * @param {any} data 
     */
    postInit(data) {
        this.postMessage(CONSTS.INIT_EVENT, data)

    }
    /**
     * post message for controller 
     * @param {string} event name of event 
     * @param {any} data 
     */
    postMessage(event, data) {


        parentPort.postMessage(createMessage(event, data));

    }
    /**
     * 
     * @param {import('./message').Message} message 
     */
    _handler(message) {


        this.emit(message.eventName, message.data)

    }




}

module.exports = Worker