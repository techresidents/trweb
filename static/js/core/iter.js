define([
    'core/base'
], function(
    base) {
    
    var StopIteration = Error('StopIteration');

    /**
     * Iterator class.
     * @constructor
     */
    var Iterator = base.Base.extend({
        initialize: function() {},

        next: function() {
            throw StopIteration;
        }
    });

    Iterator.prototype.__iterator__ = function() {
        return this;
    };

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

    var map = function(iterable, func, context) {
        iterable = toIterator(iterable);
        var newIterator = new Iterator();
        newIterator.next = function() {
            return func.call(context, iterable.next());
        };
        return newIterator;
    };

    var reduce = function(iterable, func, value, context) {
        var result = value;
        forEach(iterable, function(value) {
            result = func.call(context, result, value);
        });
        return result;
    };

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
