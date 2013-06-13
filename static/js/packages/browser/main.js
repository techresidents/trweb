define([
    'swfobject'
], function(
    swfobject) {

    /**
     * Detects the current browser and version.
     * @returns {object} browser browser.name, browser.version
     */
   var detectBrowser = function() {
        var result;
        var name = navigator.appName, userAgent = navigator.userAgent, tem;
        var match = userAgent.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
        if (match && (tem = userAgent.match(/version\/([\.\d]+)/i))!= null) match[2]= tem[1];
        if (match) {
            result = {name: match[1], version: match[2] };
        } else {
            result = {name: name, version: '?' };
        }
        return result;
    };

    /**
     * Detects the current browser and compares it against the supported
     * browsers and versions, which are passed in as an input.
     * @param {object} minVersions Browser and min versions
     * @param {String} minVersions.name Browser name
     * @param {String} minVersions.version Browser version
     * @returns {object} result
     * @returns {boolean} result.isBrowserSupported
     * @returns {boolean} result.isBrowserVersionSupported
     */
    var isBrowserCompatible = function(minVersions) {
        var result = {
            isBrowserSupported: false,
            isBrowserVersionSupported: false
        };
        var browser = detectBrowser();
        var name = browser.name.toLowerCase();
        if (minVersions.hasOwnProperty(name)) {
            result.isBrowserSupported = true;
            if (parseFloat(browser.version) >= minVersions[name]) {
                result.isBrowserVersionSupported = true;
            }
        }
        return result;
    };

    /**
     * Detect the current Flash player version
     * @returns {object} flashVersion
     * @returns {Number} flashVersion.major
     * @returns {Number} flashVersion.minor
     */
    var detectFlash = function() {
        return swfobject.getFlashPlayerVersion();
    };

    /**
     * Detects the current Flash player version and compares it against the
     * supported version, which is passed in as an input.
     * @param {Number} major Minimum major version
     * @param {Number} minor Minimum minor version
     * @returns {boolean} Returns True if the current Flash player is supported;
     *  returns False otherwise.
     */
    var isFlashCompatible = function(major, minor) {
        var result = false;
        var flash = detectFlash();
        if (flash.major > major ||
            (flash.major === major && flash.minor >= minor)) {
            result = true;
        }
        return result;
    };

    return {
        detectBrowser: detectBrowser,
        isBrowserCompatible: isBrowserCompatible,
        detectFlash: detectFlash,
        isFlashCompatible: isFlashCompatible
    };
});