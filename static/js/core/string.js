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
    
    /**
     * Trim white space from start and end of string.
     * @param {string} string String to trim
     * @returns {string} Trimmed string
     */
    var trim = function(string) {
        return string.replace(/^\s+|\s+$/g, '');
    };

    /**
     * Trim white space from start of string
     * @param {string} string String to trim
     * @returns {string} Trimmed string
     */
    var ltrim = function(string) {
        return string.replace(/^\s+/, '');
    };

    /**
     * Trim white space from end of string
     * @param {string} string String to trim
     * @returns {string} Trimmed string
     */
    var rtrim = function(string) {
        return string.replace(/\s+$/, '');
    };

    return {
        regExpEscape: regExpEscape,
        stringify: stringify,
        trim: trim,
        ltrim: ltrim,
        rtrim: rtrim
    };
});
