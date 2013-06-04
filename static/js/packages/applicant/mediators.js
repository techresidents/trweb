define([
    'underscore',
    'notifications',
    'core',
    'api',
    'ui',
    './views'
], function(
    _,
    notifications,
    core,
    api,
    ui,
    applicant_views) {

    /**
     * Tracker Mediator
     * @constructor
     */
    var TrackerMediator = core.mediator.Mediator.extend({
        name: function() {
            return TrackerMediator.NAME;
        },

        viewType: function() {
            return TrackerMediator.VIEW_TYPE;
        },

        /**
         * Notification handlers
         */
        notifications: [
            [notifications.VIEW_CREATE, 'onCreateView'],
            [notifications.VIEW_DESTROY, 'onDestroyView']
        ],

        initialize: function(options) {
            this.view = null;
            this.currentUser = new api.models.User({id: 'CURRENT'});
            this.currentTenant = this.currentUser.get_tenant();
            this.defaultCollection = this.currentTenant.get_applications();
            this.defaultQuery = this.defaultCollection.query()
                .orderBy('created__desc').slice(0,20);

            this.collection = null;
            this.query = null;
        },

        onCreateView: function(notification) {
            if(notification.type === this.viewType()) {
                var uri = notification.options.query ||
                    this.defaultQuery.toUri();

                this.collection = this.defaultCollection.clone();
                this.collection.on('reset', this.onReset, this);
                this.query = api.query.ApiQuery.parse(this.collection, uri);
                this.view = new applicant_views.TrackerView({
                    collection: this.collection,
                    query: this.query
                });

                this.facade.trigger(notifications.VIEW_CREATED, {
                    type: this.viewType(),
                    view: this.view,
                    options: _.extend(notification.options, {
                        collection: this.collection,
                        query: this.query
                    })
                });
            }
        },

        onDestroyView: function(notification) {
            if(notification.type === this.viewType()) {
                notification.view.destroy();
                notification.options.collection.off('reset', this.onReset, this);

                this.facade.trigger(notifications.VIEW_DESTROYED, {
                    type: this.viewType(),
                    view: notification.view
                });
                if(this.view === notification.view) {
                    this.view = null;
                }
            }
        },

        onReset: function() {
            var uri = this.query.toUri();
            if(uri === this.defaultQuery.toUri()) {
                uri = null;
            }
            this.facade.trigger(notifications.VIEW_NAVIGATE, {
                type: TrackerMediator.VIEW_TYPE,
                query: uri,
                trigger: false
            });
        }

    }, {

        NAME: 'TrackerMediator',
        
        VIEW_TYPE: 'TrackerView'
    });

    /**
     * Application Mediator
     * @constructor
     */
    var ApplicationMediator = core.mediator.Mediator.extend({
        name: function() {
            return ApplicationMediator.NAME;
        },

        viewType: function() {
            return ApplicationMediator.VIEW_TYPE;
        },

        /**
         * Notification handlers
         */
        notifications: [
            [notifications.VIEW_CREATE, 'onCreateView'],
            [notifications.VIEW_DESTROY, 'onDestroyView']
        ],

        initialize: function(options) {
            this.view = null;
        },

        onCreateView: function(notification) {
            if(notification.type === this.viewType()) {
                this.model = new api.models.Application({
                    id: notification.options.id
                });
                this.view = new applicant_views.ApplicationView({
                    model: this.model
                });

                this.facade.trigger(notifications.VIEW_CREATED, {
                    type: this.viewType(),
                    view: this.view,
                    options: _.extend(notification.options, {
                        model: this.model
                    })
                });
            }
        },

        onDestroyView: function(notification) {
            if(notification.type === this.viewType()) {
                notification.view.destroy();
                this.facade.trigger(notifications.VIEW_DESTROYED, {
                    type: this.viewType(),
                    view: notification.view
                });
                if(this.view === notification.view) {
                    this.view = null;
                }
            }
        }

    }, {

        NAME: 'ApplicationMediator',
        
        VIEW_TYPE: 'ApplicationView'
    });

    /**
     * OfferMediator
     * @constructor
     */
    var OfferMediator = core.mediator.Mediator.extend({
        name: function() {
            return OfferMediator.NAME;
        },

        isViewType: function(type) {
            return _.contains(OfferMediator.VIEW_TYPE, type);
        },

        /**
         * Notification handlers
         */
        notifications: [
            [notifications.VIEW_CREATE, 'onCreateView'],
            [notifications.VIEW_DESTROY, 'onDestroyView']
        ],

        initialize: function(options) {
        },

        createMakeInterviewOfferView: function(options) {
            var view = new applicant_views.MakeInterviewOfferView({
                model: options.model
            });
            delete options.model;

            var modalOptions = _.extend({
                title: 'Interview Offer',
                viewOrFactory: view
            }, options);

            var modalView = new ui.modal.views.ModalView(modalOptions);
            return modalView;
        },

        createRescindInterviewOfferView: function(options) {
            var view = new applicant_views.RescindInterviewOfferView({
                model: options.model
            });
            delete options.model;

            var modalOptions = _.extend({
                title: 'Rescind Interview Offer',
                viewOrFactory: view
            }, options);

            var modalView = new ui.modal.views.ModalView(modalOptions);
            return modalView;
        },

        onCreateView: function(notification) {
            if(!this.isViewType(notification.type)) {
                return;
            }
            var view;

            switch(notification.type) {
                case OfferMediator.VIEW_TYPE.MAKE_INTERVIEW_OFFER:
                    view = this.createMakeInterviewOfferView(notification.options);
                    break;
                case OfferMediator.VIEW_TYPE.RESCIND_INTERVIEW_OFFER:
                    view = this.createRescindInterviewOfferView(notification.options);
                    break;
            }

            this.facade.trigger(notifications.VIEW_CREATED, {
                type: notification.type,
                view: view,
                options: _.extend(notification.options, {
                    model: this.model
                })
            });
        },

        onDestroyView: function(notification) {
            if(this.isViewType(notification.type)) {
                notification.view.destroy();
                this.facade.trigger(notifications.VIEW_DESTROYED, {
                    type: this.viewType(), // TODO BUG?
                    view: notification.view
                });
            }
        }

    }, {
        NAME: 'OfferMediator',
        
        VIEW_TYPE: {
            MAKE_INTERVIEW_OFFER: 'MakeInterviewOffer',
            RESCIND_INTERVIEW_OFFER: 'RescindInterviewOffer'
        }
    });

    return {
        TrackerMediator: TrackerMediator,
        ApplicationMediator: ApplicationMediator,
        OfferMediator: OfferMediator
    };
});
