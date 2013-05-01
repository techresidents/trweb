define([
    'underscore',
    'common/notifications',
    'core/mediator',
    'api/models',
    'talent/search/views'
], function(
    _,
    notifications,
    mediator,
    api,
    talent_views) {

    /**
     * Search Mediator
     * @constructor
     */
    var SearchMediator = mediator.Mediator.extend({
        name: function() {
            return SearchMediator.NAME;
        },

        viewType: function() {
            return SearchMediator.VIEW_TYPE;
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
                var developerTenantID = 'zik0zk';
                this.collection = new api.UserSearchCollection();
                this.collection.on('reset', this.onReset, this);
                this.query = this.collection.query();
                this.view = new talent_views.SearchView({
                    collection: this.collection,
                    query: this.query
                });

                this.facade.trigger(notifications.VIEW_CREATED, {
                    type: this.viewType(),
                    view: this.view
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
                if(this.view === notification.view) {
                    this.view = null;
                }
            }
        },

        /**
         * Method to listen for reset events on the collection
         * and update the URL to include any query parameters.
         */
        onReset: function() {
            this.facade.trigger(notifications.VIEW_NAVIGATE, {
                type: this.viewType(),
                query: this.query.toUri(),
                trigger: false,
                replace: false
            });
        }

    }, {

        NAME: 'SearchMediator',
        
        VIEW_TYPE: 'SearchView'
    });

    return {
        SearchMediator: SearchMediator
    };
});
