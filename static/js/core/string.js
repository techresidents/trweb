define(/** @exports core/string */[
    'core/base'
], function(
    base) {

    /**
     * Escape string for use in regular expression.
     * @param {string} string String or object castable to String
     * @returns {string} Escaped string
     */
    var regExpEscape = function(string) {
        return String(string).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').
            replace(/\x08/g, '\\x08');
    };

    /**
     * Convert value to string through cast if needed
     * @param {object} value Any value
     * @returns {string} Value cast to string 
     */
    var stringify = function(value) {
        return String(value);
    };

    return {
        regExpEscape: regExpEscape,
        stringify: stringify
    };
});
