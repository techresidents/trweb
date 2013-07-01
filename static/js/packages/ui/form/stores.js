define(/** @exports ui/form/stores */[
    'jquery',
    'backbone',
    'underscore',
    'core'
], function(
    $,
    Backbone,
    _,
    core) {

    var Store = core.base.Base.extend(
    /** @lends module:ui/form/stores~FieldStore.prototype */ {

        /**
         * Store constructor
         * @constructor
         * @augments module:core/base~Base
         * @param {object} options Options object
         * @param {string} options.name Field name which can be used
         *   as a model path (i.e. topic__tree__title)
         */
        initialize: function(options) {
            this.name = options.name;
        },

        read: function(options) {
            return null;
        },

        write: function(value, options) {
        },

        destroy: function() {
        },

        onChange: function() {
            this.trigger('change', this);
        }
        
    });
    
    //add support for events
    _.extend(Store.prototype, Backbone.Events);

    
    var ModelAttributeStore = Store.extend(
    /** @lends module:ui/form/stores~ModelAttributeStore.prototype */ {

        /**
         * Model Attribute Store constructor
         * @constructor
         * @augments module:ui/form/stores~Store
         * @param {object} options Options object
         */
        initialize: function(options) {
            this.model = options.model;
            this.modelAttribute = options.modelAttribute;

            this.listenTo(this.model,
                'change:' + this.modelAttribute,
                this.onChange);
        },

        read: function(options) {
            return this.model.get(this.modelAttribute);
        },

        write: function(value, options) {
            this.model.set(this.modelAttribute, value);
        }
    });

    
    var ModelStore = Store.extend(
    /** @lends module:ui/form/stores~ModelStore.prototype */ {

        /**
         * Model Store constructor
         * @constructor
         * @augments module:ui/form/stores~Store
         * @param {object} options Options object
         */
        initialize: function(options) {
            this.model = options.model;
            this.withRelated = options.withRelated;

            this.modelClone = this.model.clone({
                withRelated: this.withRelated
            });

            this.listenTo(this.model, 'change', this.onChange);
        },

        read: function(options) {
            options = _.extend({
                clone: true
            }, options);

            var result = this.model;
            if(options.clone) {
                result = this.modelClone;
            }
            return result;
        },

        write: function(value, options) {
            value = value || this.modelClone;
            value.clone({
                to: this.model,
                withRelated: this.withRelated
            });
        },

        onChange: function() {
            this.model.clone({
                to: this.modelClone,
                withRelated: this.withRelated
            });
            ModelStore.__super__.onChange.call(this);
        }
        
    });
    
    
    var CollectionStore = Store.extend(
    /** @lends module:ui/form/stores~Store.prototype */ {

        /**
         * Collection Store constructor
         * @constructor
         * @augments module:ui/form/stores~Store
         * @param {object} options Options object
         */
        initialize: function(options) {
            this.collection = options.collection;
            this.withRelated = options.withRelated;

            this.collectionClone = this.collection.clone({
                withRelated: options.withRelated
            });
            this.listenTo(this.collection, 'add remove change reset', this.onChange);
        },

        read: function(options) {
            options = _.extend({
                clone: true
            }, options);

            var result = this.collection;
            if(options.clone) {
                result = this.collectionClone;
            }
            return result;
        },

        write: function(value, options) {
            value = value || this.collectionClone;
            value.clone({
                to: this.collection,
                withRelated: this.withRelated
            });
        },

        onChange: function() {
            this.collection.clone({
                to: this.collectionClone,
                withRelated: this.withRelated
            });

            //we won't get an explicit event when models
            //in the collection are destroyed on server
            //so for now we assume success and clear
            //out the toDestroy list on the collection
            //clone to prevent duplicate deletes.
            this.collectionClone.toDestroy = [];
            CollectionStore.__super__.onChange.call(this);
        }
        
    });

    var factory = new core.factory.FunctionFactory(function(options) {
        var attribute, result;
        var current = options.model;
        var relations = options.path.split('__');
    
        _.each(relations, function(relation) {
            var field;
            if(_.isObject(current.relatedFields)) {
                field = current.relatedFields[relation];
            }
            if(field) {
                current = current.getRelation(relation);
            } else {
                attribute = relation;
            }
        }, this);

        if(current instanceof Backbone.Collection) {
            result = new CollectionStore(_.extend({
                collection: current
            }, options.storeOptions));
        } else if(current instanceof Backbone.Model) {
            if(attribute) {
                result = new ModelAttributeStore(_.extend({
                    model: current,
                    modelAttribute: attribute
                }, options.storeOptions));
            } else {
                result = new ModelStore(_.extend({
                    model: current,
                    modelAttribute: attribute
                }, options.storeOptions));
            }
        }

        return result;
    });

    return {
        Store: Store,
        ModelStore: ModelStore,
        ModelAttributeStore: ModelAttributeStore,
        CollectionStore: CollectionStore,
        factory: factory
    };

});
