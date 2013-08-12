define([
    'jquery',
    'underscore',
    'core',
    'api',
    'ui',
    'events'
], function(
    $,
    _,
    core,
    api,
    ui,
    events) {

    var TrackUserModalView = core.view.View.extend({

        /**
         * Track User Modal View
         * @constructor
         * @param {Object} options
         * @param {UserModel} options.model
         *   User model for candidate to track
         */
        initialize: function(options) {
            this.model = options.model;
            this.currentUser = new api.models.User({id: 'CURRENT'});
            this.selectionCollection = new ui.select.models.SelectionCollection();
            this.requisitionMatcher = this._buildRequisitionMatcher();
            this.collection = this.currentUser.get_tenant().get_applications()
                .filterBy({ user__id: this.model.id });
            this.loader = new api.loader.ApiLoader([
                { instance: this.collection }
            ]);

            //bind events
            this.listenTo(this.loader, 'loaded', this.render);

            // init child views
            this.autoSelectView = null;
            this.initChildViews();


            //load data
            this.loader.load();
        },

        childViews: function() {
            return [this.autoSelectView];
        },

        initChildViews: function() {
            this.autoSelectView = new ui.select.views.AutoMultiSelectView({
                inputPlaceholder: 'Requisition title',
                collection: this.selectionCollection,
                matcher: this.requisitionMatcher,
                maxResults: 10
            });
        },

        classes: function() {
            return ['w-track-user-modall'];
        },

        render: function() {
            if(this.loader.isLoaded()) {
                this.autoSelectView.refresh();
                this.$el.empty();
                this.$el.attr('class', this.classes().join(' '));
                this.append(this.autoSelectView);
            }
            return this;
        },

        onSave: function() {
            var requisitions = this.selectionCollection.where({selected: true});
            _.each(requisitions, function(requisition) {
                var application = new api.models.Application({
                    user_id: this.model.id,
                    requisition_id: requisition.id
                });
                this.triggerEvent(events.CREATE_APPLICATION, {
                    model: application
                });
            }, this);
            return true;
        },

        onClose: function() {
            return true;
        },

        onCancel: function() {
            return true;
        },

        _buildRequisitionMatcher: function() {
            var that = this;
            var queryFactory = function(options) {
                return new api.models.RequisitionCollection()
                    .filterBy({
                        'tenant_id__eq': that.currentUser.get_tenant_id(),
                        'status__eq': 'OPEN'
                    })
                    .orderBy('created__desc')
                    .slice(0, 40)
                    .query();
            };

            var stringify = function(model) {
                return model.get_title();
            };

            var map = function(model) {
                var ret = null;
                if (!that.collection.where({requisition_id: model.id}).length) {
                    ret = {
                        id: model.id,
                        value: model.get_title()
                    };
                }
                return ret;
            };

            var matcher = new ui.ac.matcher.QueryMatcher({
                queryFactory: new core.factory.FunctionFactory(queryFactory),
                stringify: stringify,
                map: map,
                sort: null
            });

            return matcher;
        }
    });

    
    var TrackUserModal = ui.modal.views.ModalView.extend({

        /**
         * Tracker user modal
         * @constructor
         * @param {Object} options
         * @param {User} options.model User model
         */
        initialize: function(options) {
            options = _.extend({
                title: 'Add to Applicant Tracker'
            }, options);

            if(!options.viewOrFactory) {
                var currentUser = new api.models.User({id: 'CURRENT'});
                options.viewOrFactory = new TrackUserModalView({
                    model: options.model
                });
            }
            TrackUserModal.__super__.initialize.call(this, options);
        }
    });


    return {
        TrackUserModal: TrackUserModal
    };
});
