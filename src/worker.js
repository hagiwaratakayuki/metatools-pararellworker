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
     * @type {import('node:worker_threads').MessagePort}     * 
     */
    _parentPort

    /**
     * 
     * @param {string} eventName 
     * @param {EventEmitter} events
     * @param {import('node:worker_threads').MessagePort} parentPort      
     * */
    constructor(eventName, events, parentPort) {
        this._eventName = eventName
        this._events = events
        this._parentPort = parentPort
        this._handler = this._handler.bind(this)
        this._parentPort.on(this._eventName, this._handler)

    }
    _handler(...args) {
        return this._events.emit(this._eventName, this._parentPort, ...args)


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
     * @type {import("node:worker_threads").MessagePort}
     */
    _parentPort


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
     * @param {import('node:worker_threads').MessagePort} _parentPort 
     */
    listenMessageEvent(_parentPort = parentPort) {
        _parentPort.on('message', this._handler)
        for (const eventName of PORT_EVENTS) {
            new this._portEventsHandlerClass(eventName, this.portEvents, _parentPort)
        }
        this._parentPort = _parentPort



    }
    on(eventName, handler) {
        this.messageEvents.on(eventName, handler)

    }
    /**
     * @overload
     * @param {DefaultSupportedPortEvents} eventName 
     * @param {*} handler 
     * 
     * @overload
     * @param {string} eventName     * 
     * @param {*} handler 
     */
    onPortEvent(eventName, handler) {
        this.portEvents.on(eventName, handler)

    }

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


        this._parentPort.postMessage(createMessage(event, data))

    }
    /**
     * 
     * @param {import('./message').Message} message 
     */
    _handler(message) {


        this.messageEvents.emit(message.eventName, message.data)

    }





}

module.exports = Worker