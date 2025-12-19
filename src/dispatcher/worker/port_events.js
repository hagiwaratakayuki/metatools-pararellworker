class PortEventsDispatcher {
    /**
     * @type {string}
     */
    _eventName;

    /**
     * @type {EventEmitter}
     */
    _events;

    /**
     * @type {import('node:worker_threads').MessagePort}     *
     */
    _parentPort;

    /**
     *
     * @param {string} eventName
     * @param {EventEmitter} events
     * @param {import('node:worker_threads').MessagePort} parentPort
     * */
    constructor(eventName, events, parentPort) {
        this._eventName = eventName;
        this._events = events;
        this._parentPort = parentPort;
        this._handler = this._handler.bind(this);
        this._parentPort.on(this._eventName, this._handler);

    }
    _handler(...args) {
        return this._events.emit(this._eventName, this._parentPort, ...args);


    }


}
exports.PortEventsDispatcher = PortEventsDispatcher;
