define([
    'underscore',
    'notifications',
    'core',
    'api',
    './views'
], function(
    _,
    notifications,
    core,
    api,
    developer_offer_views) {

    /**
     * Developer Offer Mediator
     * @constructor
     * Decided to create a separate mediator to handle the individual
     * offer views since this mediator won't be working with queries
     * and collections.
     */
    var DeveloperOfferMediator = core.mediator.Mediator.extend({
        name: function() {
            return DeveloperOfferMediator.NAME;
        },

        viewType: function() {
            return DeveloperOfferMediator.VIEW_TYPE;
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
            if (notification.type === this.viewType()) {

                var offer = new api.models.InterviewOffer({
                    id: notification.options.id
                });

                this.view = new developer_offer_views.DeveloperOfferView({
                    model: offer
                });

                this.facade.trigger(notifications.VIEW_CREATED, {
                    type: this.viewType(),
                    view: this.view,
                    options: notification.options
                });
            }
        },

        onDestroyView: function(notification) {
            if (notification.type === this.viewType()) {
                notification.view.destroy();

                this.facade.trigger(notifications.VIEW_DESTROYED, {
                    type: this.viewType(),
                    view: notification.view
                });
                if (this.view === notification.view) {
                    this.view = null;
                }
            }
        }

    }, {

        NAME: 'DeveloperOfferMediator',

        VIEW_TYPE: 'DeveloperOfferView'
    });

    /**
     * Developer Offers Mediator
     * @constructor
     */
    var DeveloperOffersMediator = core.mediator.Mediator.extend({
        name: function() {
            return DeveloperOffersMediator.NAME;
        },

        viewType: function() {
            return DeveloperOffersMediator.VIEW_TYPE;
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
            this.defaultCollection = this.currentUser
                .get_interview_offers()
                .orderBy('created__desc')
                .slice(0, 20);
            this.defaultQuery = this.defaultCollection.query();
            this.collection = null;
        },

        onCreateView: function(notification) {
            if (notification.type === this.viewType()) {

                var uri = notification.options.query ||
                    this.defaultQuery.toUri();

                // Clone the default collection since this.defaultQuery
                // has a reference to the query obj within this.defaultCollection.
                // If we didn't clone, then the check against the defaultQuery in
                // onReset() would always pass and set the uri = null.
                this.collection = this.defaultCollection.clone();
                this.collection.on('reset', this.onReset, this);
                this.collection.query().parse(uri);
                this.view = new developer_offer_views.DeveloperOffersView({
                    collection: this.collection
                });

                this.facade.trigger(notifications.VIEW_CREATED, {
                    type: this.viewType(),
                    view: this.view,
                    options: _.extend(notification.options, {
                        collection: this.collection
                    })
                });
            }
        },

        onDestroyView: function(notification) {
            if (notification.type === this.viewType()) {

                notification.view.destroy();
                notification.options.collection.off('reset', this.onReset, this);

                this.facade.trigger(notifications.VIEW_DESTROYED, {
                    type: this.viewType(),
                    view: notification.view
                });

                if (this.view === notification.view) {
                    this.view = null;
                }
            }
        },

        onReset: function() {
            // This will prevent an infinite loop from occurring
            // whereby the back button takes the user to a page such as
            // /offers/ which then redirects to /offers?<defaultQuery>
            var uri = this.collection.query().toUri();
            if (uri === this.defaultQuery.toUri()) {
                uri = null;
            }
            this.facade.trigger(notifications.VIEW_NAVIGATE, {
                type: DeveloperOffersMediator.VIEW_TYPE,
                query: uri,
                trigger: false
            });
        }

    }, {

        NAME: 'DeveloperOffersMediator',

        VIEW_TYPE: 'DeveloperOffersView'
    });

    return {
        DeveloperOfferMediator: DeveloperOfferMediator,
        DeveloperOffersMediator: DeveloperOffersMediator
    };
});
