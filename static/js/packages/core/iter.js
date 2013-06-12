define(/** @exports core/iter */[
    './base'
], function(
    base) {
    
    /**
     * StopIteration exception.
     */
    var StopIteration = Error('StopIteration');

    var Iterator = base.Base.extend(
    /** @lends module:core/iter~Iterator.prototype */ {

        /**
         * Iterator constructor
         * @constructs
         */
        initialize: function() {},

        /**
         * Get next iterator value.
         * @returns {object} Next iterator value.
         * @throws {module:core/iter~StopIteration} Throws StopIteration
         *  if no values are left in the iteration.
         */
        next: function() {
            throw StopIteration;
        }
    });

    Iterator.prototype.__iterator__ = function() {
        return this;
    };

    /**
     * Convert iterable to an iterator if it is not already.
     * @param {function|number|object} iterable Value to convert to iterator.
     * @returns {module:core/iter~Iterator} Iterator object
     */
    var toIterator = function(iterable) {
        var i, iter;
        if(iterable instanceof Iterator) {
            return iterable;
        }
        if(typeof iterable.__iterator__ === 'function') {
            return iterable.__iterator__();
        }
        if(typeof iterable.length === 'number') {
            i = 0;
            iter = new Iterator();
            iter.next = function() {
                if(i >= iterable.length) {
                    throw StopIteration;
                }
                return iterable[i++];
            };
            return iter;
        }
        if(typeof iterable === 'object') {
            var key, keys = [];
            i = 0;
            iter = new Iterator();
            for(key in iterable) {
                if(iterable.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }

            iter.next = function() {
                if(i >= keys.length) {
                    throw StopIteration;
                }
                var key = keys[i++];
                return {
                    key: key,
                    value: iterable[key]
                };
            };
            return iter;
        }
    };

    /**
     * Invoke func for each item in iterable.
     * @param {module:core/iter~Iterator|function|number|object}
     *  iterable Iterator or something which can be converted to
     *  an iterator with {@link module:core/iter~toIterator}.
     * @param {function(value)} func Function taking an iterator value
     *  which will be called for each item in the iterator.
     * @param {object} context Context to be used to invoke func.
     */
    var forEach = function(iterable, func, context) {
        iterable = toIterator(iterable);
        try {
            while(true) {
                func.call(context, iterable.next());
            }
        } catch(e) {
            if(e !== StopIteration) {
                throw e;
            }
        }
    };

    /**
     * Create a new iterator containing all values in iterable
     * which pass the truth test contained in func.
     * @param {module:core/iter~Iterator|function|number|object}
     *  iterable Iterator or something which can be converted to
     *  an iterator with {@link module:core/iter~toIterator}.
     * @param {function} func(value) Function taking an iterator value
     *  and returning true if item should be included, or false
     *  if the item should not be included.
     * @param {object} context Context to be used to invoke func.
     * @returns {module:core/iter~Iterator} Iterator object
     */
    var filter = function(iterable, func, context) {
        var newIterator = new Iterator();
        iterable = toIterator(iterable);

        newIterator.next = function() {
            while(true) {
                var value = iterable.next();
                if(func.call(context, value)) {
                    return value;
                }
            }
        };
        return newIterator;

    };

    /**
     * Create a new iterator to iterate over an integer range.
     * @param {number} startOrStop Start or stop integer. If this
     *  is the only argument it will be considered the stopping point
     *  and start will be assumed to be 0.
     * @param {number} [stopArg] Stop integer (non-inclusive)
     * @param {number} [stepArg=1] Step integer to increment by.
     * @returns {module:core/iter~Iterator} Iterator object
     */
    var range = function(startOrStop, stopArg, stepArg) {
        var start = 0;
        var stop = startOrStop;
        var step = stepArg || 1;
        if(arguments.length > 1) {
            start = startOrStop;
            stop = stopArg;
        }

        var newIterator = new Iterator();
        newIterator.next = function() {
            if((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
                throw StopIteration;
            }

            var result = start;
            start += step;
            return result;
        };
        return newIterator;
    };

    /**
     * Create a new iterator of mapped iterable values.
     * @param {module:core/iter~Iterator|function|number|object}
     *  iterable Iterator or something which can be converted to
     *  an iterator with {@link module:core/iter~toIterator}.
     * @param {function(value)} func Function taking an iterator value
     *  and returning the mapped value to be included in the
     *  returned iterator.
     * @param {object} context Context to be used to invoke func.
     * @returns {module:core/iter~Iterator} Iterator object
     */
    var map = function(iterable, func, context) {
        iterable = toIterator(iterable);
        var newIterator = new Iterator();
        newIterator.next = function() {
            return func.call(context, iterable.next());
        };
        return newIterator;
    };

    /**
     * Reduce iterable values to a single value.
     * @param {module:core/iter~Iterator|function|number|object}
     *  iterable Iterator or something which can be converted to
     *  an iterator with {@link module:core/iter~toIterator}.
     * @param {function(result, value)} func Function taking a partial
     * result, an iterator value, and returning a new result.
     * @param {object} value Inital result value
     * @param {object} context Context to be used to invoke func.
     * @returns {module:core/iter~Iterator} Iterator object
     */
    var reduce = function(iterable, func, value, context) {
        var result = value;
        forEach(iterable, function(value) {
            result = func.call(context, result, value);
        });
        return result;
    };

    /**
     * Returns true if some of the iteratable values pass the truth
     * test contained in func, false otherwise.
     * @param {module:core/iter~Iterator|function|number|object}
     *  iterable Iterator or something which can be converted to
     *  an iterator with {@link module:core/iter~toIterator}.
     * @param {function} func(value) Function taking an iterator value
     *  and returning true or false.
     * @param {object} context Context to be used to invoke func.
     * @returns {module:core/iter~Iterator} Iterator object
     */
    var some = function(iterable, func, context) {
        iterable = toIterator(iterable);
        try {
            while(true) {
                if(func.call(context, iterable.next())) {
                    return true;
                }
            }
        } catch(e) {
            if(e !== StopIteration) {
                throw e;
            }
        }
        return false;
    };

    /**
     * Returns true if all of the iterable values pass the truth
     * test contained in func, false otherwise.
     * @param {module:core/iter~Iterator|function|number|object}
     *  iterable Iterator or something which can be converted to
     *  an iterator with {@link module:core/iter~toIterator}.
     * @param {function} func(value) Function taking an iterator value
     *  and returning true or false.
     * @param {object} context Context to be used to invoke func.
     * @returns {module:core/iter~Iterator} Iterator object
     */
    var every = function(iterable, func, context) {
        iterable = toIterator(iterable);
        try {
            while(true) {
                if(!func.call(context, iterable.next())) {
                    return false;
                }
            }
        } catch(e) {
            if(e !== StopIteration) {
                throw e;
            }
        }
        return true;
    };

    /**
     * Create a new iterator containing a slice of the values in iterable.
     * @param {module:core/iter~Iterator|function|number|object}
     *  iterable Iterator or something which can be converted to
     *  an iterator with {@link module:core/iter~toIterator}.
     * @param {number} start Start or Stop integer of slice
     * @param {number} [stop] Stop integer of slice (non-inclusive)
     * @param {number} [step=1] Step integer of slice (non-inclusive)
     * @returns {module:core/iter~Iterator} Iterator object
     */
    var slice = function(iterable, start, stop, step) {
        iterable = toIterator(iterable);
        var r = range(start, stop, step);
        var next, i = -1;
        var newIterator = new Iterator();
        newIterator.next = function() {
            next = r.next();
            var result;
            while(i !== next) {
                result = iterable.next();
                i++;
            }
            return result;
        };
        return newIterator;
    };

    var toArray = function(iterable) {
        var result = [];
        forEach(iterable, function(value) {
            result.push(value);
        });
        return result;
    };


    return {
        Iterator: Iterator,
        StopIteration: StopIteration,
        toIterator: toIterator,
        toArray: toArray,
        forEach: forEach,
        filter: filter,
        map: map,
        reduce: reduce,
        range: range,
        some: some,
        every: every,
        slice: slice
    };
});
