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
        return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').
            replace(/\x08/g, '\\x08');
    };

    return {
        regExpEscape: regExpEscape
    };
});
