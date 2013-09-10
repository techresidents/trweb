define(/** @exports core/string */[
    './base'
], function(
    base) {

    /**
     * Test if string is equal to a string in array of options
     * @param {string} string String to test
     * @param {array} options Array of strings to test 
     * @returns {boolean} True if string in options, false otherwise
     */
    var oneOf = function(string, options) {
        var i, result = false;
        for(i = 0; i < options.length; i++) {
            if(string === options[i]) {
                result = true;
                break;
            }
        }
        return result;
    };

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

    var titleText = function(string) {
        var result = string;
        var titleText, underscoreToWhitespace;
        if (string && string.length > 1) {
            underscoreToWhitespace = string.replace(/_/gi, ' ');
            titleText = underscoreToWhitespace.replace(/\w\S*/g, function(txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
            result = titleText;
        }
        return result;
    };

    return {
        oneOf: oneOf,
        regExpEscape: regExpEscape,
        stringify: stringify,
        trim: trim,
        ltrim: ltrim,
        rtrim: rtrim,
        titleText: titleText
    };
});
