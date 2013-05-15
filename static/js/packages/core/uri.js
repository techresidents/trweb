define(/** @exports core/uri */[
    './base'
], function(
    base) {
    
    //Encoding map for URI delims and reserved characters
    var encodingMap = {
        ' ': '%20',
        '"': '%22',
        '#': '%23',
        '$': '%24',
        '%': '%25',
        '&': '%26',
        '+': '%2B',
        ',': '%2C',
        '/': '%2F',
        ':': '%3A',
        ';': '%3B',
        '<': '%3C',
        '=': '%3D',
        '>': '%3E',
        '?': '%3F',
        '@': '%40'
    };
    
    // URI Path Segment regex to match characters which need replacing.
    var encodeURIPathRegex = /[\s<>#%"\/;\=\?]/g;

    /**
     * Encode URI path segments.
     * See Sectin 3.3 {@link http://www.ietf.org/rfc/rfc2396.txt}
     * @param {string} pathSegment Path segment to encode..
     * @returns {string} Encode URI path segment
     */
    var encodeURIPathSegment = function(pathSegment) {
        return pathSegment.replace(encodeURIPathRegex, function(match) {
            return encodingMap[match];
        });
    };

    return {
        encodeURIPathSegment: encodeURIPathSegment
    };
});
