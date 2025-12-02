const CONSTS = require('./consts')
const { parentPort, workerData } = require('node:worker_threads')
const { EventEmitter } = require('node:events')
const createMessage = require('./message')

/**
 * @typedef  {"close" |  "messageerror"} DefaultSupportedPortEvents
 * @type {DefaultSupportedPortEvents[]}
 */
const PORT_EVENTS = ['close', 'messageerror']

class DefultPortEventsHandler {
    /**
     * @type {string}
     */
    _eventName

    /**
     * @type {EventEmitter}
     */
    _events

    /**
     * @type {MessgePort}
     * 
     * 
     */
    _messagePort
    /**
     * 
     * @param {string} eventName 
     * @param {EventEmitter} events
     * @param {MessagePort} messagePort  
     */

    constructor(eventName, events, messagePort) {
        this._eventName = eventName
        this._events = events
        this._messagePort = messagePort

    }
    _handler(...args) {
        return this._events.emit(this._eventName, this._messagePort, ...args)


    }


}

class Worker {
    /**
     * @type {EventEmitter}
     */
    messageEvents

    /**
     * @type {EventEmitter}
     */
    portEvents

    /**
     * @type {typeof DefultPortEventsHandler}
     */
    _portEventsHandlerClass





    /**
     * 
     * @param {any} [messageEventOptions={}] 
     * @param {any} [portEventOptions={}]
     * @param {typeof EventEmitter} [messageEventsClass=EventEmitter] 
     * @param {typeof EventEmitter} [portEventsClass=EventEmitter] 
     * @param {typeof DefultPortEventsHandler} [portEventsHandlerClass=DefultPortEventsHandler]  
     */
    constructor(messageEventOptions = {}, portEventOptions = {}, messageEventsClass = EventEmitter, portEventsClass = EventEmitter, portEventsHandlerClass = DefultPortEventsHandler) {

        this.messageEvents = new messageEventsClass(messageEventOptions)
        this.portEvents = new portEventsClass(portEventOptions)
        this._portEventsHandlerClass = portEventsHandlerClass
        this._handler = this._handler.bind(this)
        this.listenMessageEvent()

    }
    /**
     * 
     * @param {MessagePort} _parentPort 
     */
    listenMessageEvent(_parentPort = parentPort) {
        _parentPort.on('message', this._handler)
        for (const eventName of PORT_EVENTS) {
            new this._portEventsHandlerClass(eventName, this.portEvents, _parentPort)
        }

    }
    on(eventName, handler) {
        this.messageEvents.on(eventName, handler)

    }
    onPortEvent(eventName, handler) {
        this.portEvents.on(eventName, handler)

    }
    /**
    getWokerData() {
        return workerData
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


        parentPort.postMessage(createMessage(event, data))

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