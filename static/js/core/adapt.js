define(/** @exports core/adapt */[
    'jquery',
    'underscore',
    'backbone',
    'core/base'
], function($, _, Backbone, base) {
    
    var CollectionAdapter = base.Base.extend(
    /** @lends module:core/adapt~CollectionAdapter.prototype */ {

        /**
         * CollectionAdapter constructor.
         * @constructs
         * @classdesc
         * Adapter to convert from one collection type to another.
         * This is useful to adapt collections for use with UI components
         * which require collections conforming to a specific interface.
         * Changes to the collection will be propagated to the 
         * adaptedCollection, but not vice versa.
         * <br><br>
         * Note that models in the adaptedCollection contain a
         * 'sourceModel' property which contains the corresponding
         * collection model to allow for reverse mapping.
         *
         * @augments module:core/base~Base
         * @param {object} options Options object
         * @param {Collection} options.collection Collection to be adapted
         * @param {Collection} options.adaptedCollection Collection to adapt to
         * @param {function} options.map Map function which takes a
         *   collection model and returns an object literal containing
         *   the adaptedCollection model's attributes.
         * @param {boolean} [options.sync=true] If true collection
         *   will be sync'd to adaptedCollection at construction.
         * @param {Events} [options.events] Object containing an Events mixin
         * (listenTo() method) to use to bind to collection events. This
         * paramater is typically a View instance. If provided, it is
         * not necessary to call stopListening() to unbind collection event 
         * listeners. If possible this parameter should be provided to make
         * event listener removal simpler.
         *
         * @example
         *   var collection = new api.UserCollection();
         *   var adaptedCollection = new select_models.SelectionCollection();
         *
         *   var map = function(userModel) {
         *     //Note that we do not include a 'selected: false' attribute
         *     //so the default will be used. This is prefered since
         *     //on a change to the userModel this method will be called
         *     //again and the returned attributes will be set on the
         *     //SelectionModel. In this case, we would not want to
         *     //the selectedAttribute on the SelectionModel.
         *     return {
         *       value: model.get_first_name()
         *     };
         *   };
         *
         *   var adpater = new CollectionAdapter({
         *     collection: collection,
         *     adaptedCollection: adaptedCollection,
         *     map: map,
         *     events: this, //assuming 'this' is View object
         *     sync: true
         *   });
         *
         *   var onSelectedChange: function(selectionModel) {
         *     var userModel = selectionModel.sourceModel;
         *   };
         *
         *   this.listenTo(adaptedCollection, 'change:selected', onSelectedChange);
         *
         *   var selectionView = new select_views.SelectionView({
         *     collection: adaptedCollection
         *   });
         */
        initialize: function(options) {
            options = _.extend({
                sync: true
            }, options);

            this.collection = options.collection;
            this.adaptedCollection = options.adaptedCollection;
            this.map = options.map;
            this.events = options.events || _.extend({}, Backbone.Events);
            this.modelMap = {};

            this.events.listenTo(this.collection, 'reset', _.bind(this.onReset, this));
            this.events.listenTo(this.collection, 'add', _.bind(this.onAdd, this));
            this.events.listenTo(this.collection, 'remove', _.bind(this.onRemove, this));
            this.events.listenTo(this.collection, 'change', _.bind(this.onChange, this));
            
            if(options.sync) {
                this.sync();
            }
        },

        /**
         * Unbind collection event listeners.
         * This method does not need to be called if an events
         * options was provided at construction.
         */
        stopListening: function() {
            this.events.stopListening();
        },
        
        /**
         * Get the adapted collection.
         * @returns {Collection} Adapted collection instance.
         */
        getAdaptedCollection: function() {
            return this.adaptedCollection;
        },

        /**
         * Get the adapted collection model associated with model.
         * @returns {Model} Adapted collection model instance.
         */
        getAdaptedModel: function(model) {
            return this.adaptedCollection.get(this.modelMap[model.cid]);
        },

        /**
         * Reset the adapted collection with remapped collection models.
         */
        sync: function() {
            var adaptedModels = [];
            this.collection.map(function(model) {
                adapatedModels.push(this._createAdaptedModel(model));
            }, this);
            this.adaptedCollection.reset(adaptedModels);
        },
        
        onReset: function() {
            this.sync();
        },

        onAdd: function(model) {
            var adaptedModel = this._createAdaptedModel(model);
            this.adaptedCollection.add(adaptedModel);
        },

        onRemove: function(model) {
            var adaptedModel = this.getAdaptedModel(model);
            if(adaptedModel) {
                this.adaptedCollection.remove(adaptedModel);
            }
            delete this.modelMap[model.cid];
        },

        onChange: function(model) {
            var adaptedModel = this.getAdaptedModel(model);
            adaptedModel.set(this.map(model));
        },

        _createAdaptedModel: function(model) {
            var adaptedModel = new this.adaptedCollection.model(this.map(model));
            adaptedModel.sourceModel = model; 
            this.modelMap[model.cid] = adaptedModel.cid;
            return adaptedModel;
        }

    });

    var ModelCollectionAdapter = base.Base.extend(
    /** @lends module:core/adapt~ModelCollectionAdapter.prototype */ {

        /**
         * CollectionAdapter constructor.
         * @constructs
         * @classdesc
         * Adapter to convert from a model to a collection.
         * This is useful to adapt a model for use with UI components
         * which require collections. For example, to convert a model
         * to a MenuItemCollection of allowed actions.
         * <br><br>
         * Changes to the model will be propagated to the 
         * adaptedCollection, but not vice versa.
         *
         * @augments module:core/base~Base
         * @param {object} options Options object
         * @param {Model} options.model Model to be adapted
         * @param {Collection} options.adaptedCollection Collection to adapt to
         * @param {function} options.map Map function which takes a
         *   model and returns an array of object literals containing the
         *   adaptedCollection model attributes.
         * @param {boolean} [options.sync=true] If true collection
         *   will be sync'd to adaptedCollection at construction.
         * @param {Events} [options.events] Object containing an Events mixin
         * (listenTo() method) to use to bind to collection events. This
         * paramater is typically a View instance. If provided, it is
         * not necessary to call stopListening() to unbind collection event 
         * listeners. If possible this parameter should be provided to make
         * event listener removal simpler.
         * 
         * @example
         *   var model = new api.UserModel();
         *   var adaptedCollection = new menu_models.MenuItemCollection();
         *   var map = function(userModel) {
         *     return [
         *       {key: 'track', label: 'Track user'},
         *       {key: 'request-interview', label: 'Request interview'},
         *     ];
         *   };
         *
         *   var adapter = new ModelColelctionAdapter({
         *     model: model,
         *     adaptedCollection: adaptedCollection,
         *     events: this, //assuming this is View intance
         *     sync: true
         *   });
         *
         *   var menuView = new menu_views.Menu({
         *     collection: adaptedCollection
         *   });
         *   
         */
        initialize: function(options) {
            options = _.extend({
                sync: true
            }, options);

            this.model = options.model;
            this.adaptedCollection = options.adaptedCollection;
            this.map = options.map;
            this.events = options.events || _.extend({}, Backbone.Events);

            this.events.listenTo(this.model, 'change', _.bind(this.onChange, this));
            
            if(options.sync) {
                this.sync();
            }
        },

        /**
         * Unbind collection event listeners.
         * This method does not need to be called if an events
         * options was provided at construction.
         */
        stopListening: function() {
            this.events.stopListening();
        },
        
        /**
         * Get the adapted collection.
         * @returns {Collection} Adapted collection instance.
         */
        getAdaptedCollection: function() {
            return this.adaptedCollection;
        },

        /**
         * Reset the adapted collection from remapped model.
         */
        sync: function() {
            var adaptedModels = this.map(this.model);
            this.adaptedCollection.reset(adaptedModels);
        },

        onChange: function(model) {
            this.sync();
        }
    });

    return {
        CollectionAdapter: CollectionAdapter,
        ModelCollectionAdapter: ModelCollectionAdapter
    };
});
