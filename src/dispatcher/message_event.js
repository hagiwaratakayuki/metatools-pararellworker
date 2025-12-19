class MessageEventDispatcher {
    /**
     * @type {any}
     */
    _id;

    /**
     * @type {import('node:events').EventEmitter}
     */
    _events;

    /**
     * @param {*} id
     * @param {import('node:events').EventEmitte} events
     */
    constructor(id, events) {
        this._id = id;
        this._events = events;



    }
    /**
     *
     * @param {import('../message').Message} message
     *
     */
    messageDispatch(message, id) {


        this._events.emit(message.eventName, message.data, this._id);
    }

}
exports.MessageEventDispatcher = MessageEventDispatcher;
