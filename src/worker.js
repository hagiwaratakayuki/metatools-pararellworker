const CONSTS = require('./consts')
const { parentPort, workerData } = require('node:worker_threads')
const { EventEmitter } = require('node:events')
const createMessage = require('./message')
const { PortEventsDispatcher } = require('./dispatcher/worker/port_events')

/**
 * @typedef  {"close" |  "messageerror"} DefaultSupportedPortEvents
 * @type {DefaultSupportedPortEvents[]}
 */
const PORT_EVENTS = ['close', 'messageerror']


/**
 *
 * @template {{}} SendMessageProtocolMapT
 * @template {{}} RecieveMessageProtocolMapT
 */
class Worker {
    /**
     * @type {EventEmitter<import('./protocol').ProtocolMapToEventMap<RecieveMessageProtocolMapT>>}
     */
    messageEvents

    /**
     * @type {EventEmitter}
     */
    portEvents

    /**
     * @type {typeof PortEventsDispatcher}
     */
    _portEventsDispatcherClass

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
     * @param {typeof PortEventsDispatcher} [portEventsDispatcherClass=PortEventsDispatcher]  
     */
    constructor(messageEventOptions = {}, portEventOptions = {}, messageEventsClass = EventEmitter, portEventsClass = EventEmitter, portEventsDispatcherClass = PortEventsDispatcher) {

        this.messageEvents = new messageEventsClass(messageEventOptions)
        this.portEvents = new portEventsClass(portEventOptions)
        this._portEventsDispatcherClass = portEventsDispatcherClass
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
            new this._portEventsDispatcherClass(eventName, this.portEvents, _parentPort)
        }
        this._parentPort = _parentPort



    }
    /**
     * shorthand set handler for  message
     * @template {keyof SendMessageProtocolMapT} eventNameT 
     * @param {eventNameT} eventName
     * @param {import('./protocol').ProtocolMapToEventMap<RecieveMessageProtocolMapT>[eventName]} handler 
     */
    on(eventName, handler) {
        this.messageEvents.on(eventName, handler)

    }
    /**
     
     * @param {DefaultSupportedPortEvents} eventName 
     * @param {*} handler 
     * 
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
     * @template {keyof SendMessageProtocolMapT} eventNameT 
     * @param {eventNameT} eventName
     * @param {SendMessageProtocolMapT[eventNameT]} data  
     */
    postMessage(eventName, data) {


        this._parentPort.postMessage(createMessage(eventName, data))

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