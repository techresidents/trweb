define([
    'jquery',
    'underscore',
    'core'
], function(
    $,
    _,
    core) {

    /**
     * ApiFetcher
     * @constructor
     * @param {Object} attributes
     * @param {Object} options
     */
    var ApiFetcher = core.base.Base.extend({

        initialize: function(queries, options) {
            this.queries = queries || [];
        },

        fetch: function(options) {
            var queries = this.queries;
            var error = 0, success = 0;
            options = options || {};

            var errorCallback = function() {
                error += 1;
                if(error + success >= queries.length) {
                    if(error) {
                        if(_.isFunction(options.error)) {
                            options.error();
                        }
                    }
                    else {
                        if(_.isFunction(options.success)) {
                            options.success();
                        }
                    }
                }
            };
            var successCallback = function() {
                success += 1;
                if(error + success >= queries.length) {
                    if(error) {
                        if(_.isFunction(options.error)) {
                            options.error();
                        }
                    }
                    else {
                        if(_.isFunction(options.success)) {
                            options.success();
                        }
                    }
                }
            };
            
            _.each(queries, function(query) {
                query.fetch({
                    success: _.bind(successCallback, this),
                    error: _.bind(errorCallback, this)
                });
            }, this);
        }
    });

    return {
        ApiFetcher: ApiFetcher
    };
});
