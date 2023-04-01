const CONSTS = require('./consts')
const { parentPort, workerData } = require('worker_threads');
const {EventEmitter} = require('node:events')
const createMessage = require('./message');

class Worker extends EventEmitter {
    /**
     * @param {any} options
     * @param {any} emitterOptions 
     */
    constructor(emitterOptions={}){        
        super(emitterOptions)
        
        this._handler = this._handler.bind(this);
        parentPort.on('message', this._handler);

    }
    getWokerData(){
        return workerData;
    }
    /**
     * 
     * @param {any} data 
     */
    postInit(data) {
        this.postMessage(CONSTS.INIT_EVENT, data)

    }
    /**
     * 
     * @param {string} key 
     * @param {any} data 
     */
    postMessage (key, data){
       
       
        parentPort.postMessage(createMessage(key, data));

    }
    /**
     * 
     * @param {import('./message').Message} message 
     */
    _handler(message) {
       
       
        this.emit(message.key, message.data)

    }
   



}

module.exports = Worker