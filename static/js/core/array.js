define([
    'core/base'
], function(
    base) {

    /**
     * Default compare function for array.
     * @return 1 if a > b,
     *         0 if a === b,
     *         -1 if a < b 
     */
    var defaultCompare = function(a, b) {
        return a > b ? 1 : a < b ? -1: 0;
    };

    /**
     * Binary search array for target using compareFunction.
     * @param {array} array
     * @param {Object} target
     * @param {function} compareFunction conforming to defaultCompare.
     *
     * @return {number} index of target if found,
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
     * @param {function} compareFunction conforming to defaultCompare.
     *
     * @return {number} insertion index
     */
    var binaryInsert = function(array, target, compareFunction) {
        compareFunction = compareFunction || defaultCompare;

        var index = binarySearch(array, target, compareFunction);
        if(index < 0) {
            index = -(index + 1);
        }
        array.splice(index, 0, target); 
        return index;
    };

    return {
        binarySearch: binarySearch,
        binaryInsert: binaryInsert,
        defaultCompare: defaultCompare
    };
});
