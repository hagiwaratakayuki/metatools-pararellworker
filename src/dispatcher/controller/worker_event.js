class WorkerEventDispatcher {
    /**
     * @type {any}
     */
    _id;
    /**
     * @type {EventEmitter}
     */
    _events;

    /**
     * @type {Worker}
     */
    _worker;
    /**
     * @type {string}
     */
    _eventName;


    /**
     *
     * @param {*} id
     * @param {EventEmitter} events
     * @param {string} eventName
     *
     */
    constructor(id, worker, events, eventName) {
        this._id = id;
        this._events = events;
        this._worker = worker;
        this._eventName = eventName;
        const handleEvent = this.handleEvent.bind(this);
        this._worker.on(eventName, handleEvent);



    }
    handleEvent(...args) {
        /**
         * @type {import("../../protocol").WorkerData}
         */
        const workerData = { workerId: this._id, worker: this._worker };

        this._events.emit(this._eventName, workerData, ...args);






    }
}
exports.WorkerEventDispatcher = WorkerEventDispatcher;
