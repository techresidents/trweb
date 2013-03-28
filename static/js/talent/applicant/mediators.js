define([
    'underscore',
    'common/notifications',
    'core/mediator',
    'api/models',
    'api/query',
    'ui/modal/views',
    'talent/notifications',
    'talent/applicant/views'
], function(
    _,
    notifications,
    mediator,
    api,
    api_query,
    modal_views,
    talent_notifications,
    applicant_views) {

    /**
     * Tracker Mediator
     * @constructor
     */
    var TrackerMediator = mediator.Mediator.extend({
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
        },

        onCreateView: function(notification) {
            if(notification.type === this.viewType()) {
                this.collection = new api.ApplicationCollection();
                if(notification.options.query) {
                    this.query = api_query.ApiQuery.parse(
                            this.collection,
                            notification.options.query);
                } else {
                    this.query = this.collection.query();
                }

                this.collection.on('reset', this.onReset, this);

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
            this.facade.trigger(notifications.VIEW_NAVIGATE, {
                type: TrackerMediator.VIEW_TYPE,
                query: this.query.toUri(),
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
    var ApplicationMediator = mediator.Mediator.extend({
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
                this.view = new applicant_views.ApplicationView({
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
    var OfferMediator = mediator.Mediator.extend({
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

            var modalView = new modal_views.ModalView(modalOptions);
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

            var modalView = new modal_views.ModalView(modalOptions);
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
                    type: this.viewType(),
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
