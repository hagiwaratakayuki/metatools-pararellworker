/**
 * @typedef {Object} Message
 * @property {string} eventName
 * @property {any} data
 */
/**
 * @param {string} eventName
 * @param {any} data
 * @returns {Message}
 */
function createMessage (eventName, data) {
    return {eventName, data};
}
module.exports = createMessage