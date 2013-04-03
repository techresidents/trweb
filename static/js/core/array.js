define(/** @exports core/array */[
    'underscore',
    'core/base'
], function(
    underscore,
    base) {

    /**
     * Default compare function for array.
     * @returns 1 if a > b,
     *         0 if a === b,
     *         -1 if a < b 
     */
    var defaultCompare = function(a, b) {
        return a > b ? 1 : a < b ? -1: 0;
    };

    /**
     * Binary search array for target using compareFunction.
     * @param {array} array Array to search.
     * @param {Object} target Value to search for.
     * @param {function} [compareFunction={@link module:core/array~defaultCompare}]
     *   Compare function conforming to defaultCompare.
     *
     * @returns {number} index of target if found,
     *                  insertion index as (-index -1) otherwise
     */
    var binarySearch = function(array, target, compareFunction) {
        compareFunction = compareFunction || defaultCompare;

        var start = 0;
        var end = array.length;
        var found = false;

        while(start < end) {
            var middle = (start + end) >> 1;
            var compareResult = compareFunction(target, array[middle]);

            if(compareResult > 0) {
                start = middle + 1;
            } else {
                end = middle;
                found = (compareResult === 0);
            }
        }

        return found ? start : -start -1;
    };

    /**
     * Binary insert target into array using compareFunction.
     * @param {array} array
     * @param {Object} target to insert
     * @param {function} [compareFunction={@link module:core/array~defaultCompare}]
     *   Compare function conforming to defaultCompare.
     *
     * @returns {number} insertion index
     */
    var binaryInsert = function(array, target, compareFunction) {
        compareFunction = compareFunction || defaultCompare;

        var index = binarySearch(array, target, compareFunction);
        if(index < 0) {
            index = -(index + 1);
        } else {
            while(index < array.length 
                    && compareFunction(array[index], target) === 0) {
                index++;
            }
        }
        array.splice(index, 0, target); 
        return index;
    };

    /**
     * Compute the average value of the array.
     * @param {array} array
     * @returns {number} Array average
     */
    var average = function(array) {
        var result = 0;
        if(array.length) {
            result = _.reduce(array, function(result, v) {
                return result + v;
            }, 0) / array.length;
        }
        return result;
    };

    return {
        binarySearch: binarySearch,
        binaryInsert: binaryInsert,
        defaultCompare: defaultCompare,
        average: average
    };
});
