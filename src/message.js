/**
 * @typedef {Object} Message
 * @property {string} key
 * @property {any} data
 */
/**
 * @param {string} key
 * @param {any} data
 * @returns {Message}
 */
function createMessage (key, data) {
    return {key, data};
}
module.exports = createMessage