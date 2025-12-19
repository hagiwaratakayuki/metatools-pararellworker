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
     * @param {import('../../message').Message} message
     *
     */
    messageDispatch(message, id) {

        if ('data' in message && typeof message.data !== 'undefined' && message.data !== null) {
            this._events.emit(message.eventName, message.data, this._id);
        }
        else {
            this._events.emit(message.eventName, this._id);
        }

    }

}
exports.MessageEventDispatcher = MessageEventDispatcher;
