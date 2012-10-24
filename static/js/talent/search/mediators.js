define([
    'Underscore',
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

        /**
         * Notification handlers
         */
        notifications: [
            [notifications.VIEW_CREATE, 'onCreateView'],
            [notifications.VIEW_DESTROY, 'onDestroyView']
        ],

        initialize: function(options) {
            this.userCollection = new api.UserCollection();
            this.view = null;
        },

        onCreateView: function(notification) {
            if(notification.type === SearchMediator.VIEW_TYPE) {
                this.view = new talent_views.SearchView({
                    collection: this.userCollection
                });
                this.userCollection.fetch();

                this.facade.trigger(notifications.VIEW_CREATED, {
                    type: SearchMediator.VIEW_TYPE,
                    view: this.view
                });
            }
        },

        onDestroyView: function(notification) {
            if(notification.type === SearchMediator.VIEW_TYPE) {
                notification.view.destroy();

                this.facade.trigger(notifications.VIEW_DESTROYED, {
                    type: SearchMediator.VIEW_TYPE,
                    view: notification.view
                });
                if(this.view === notification.view) {
                    this.view = null;
                }
            }
        }

    }, {

        NAME: 'SearchMediator',
        
        VIEW_TYPE: 'SearchView'
    });

    return {
        SearchMediator: SearchMediator
    };
});
