define([
    'jQuery',
    'Underscore',
    'core/base',
    'core/facade',
], function($, _, base, facade) { 

    var Proxy = function(options) {
        this.facade = facade.getInstance();
        this.options = options || {};
        this.initialize.apply(this, arguments);
    };

    Proxy.extend = base.extend;

    _.extend(Proxy.prototype, {

        name: null,

        initialize: function() {},
    });

    var ModelProxy = Proxy.extend({

        name: null,

        initialize: function(options) {
            this.model = this.options.model;
        },
    });

    var CollectionProxy = Proxy.extend({

        collection: null,

        initialize: function(options) {
            this.collection = this.options.collection;
        },
    });

    return {
        Proxy: Proxy,
    };
});
