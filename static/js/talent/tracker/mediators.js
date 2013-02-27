define([
    'underscore',
    'common/notifications',
    'core/mediator',
    'api/models',
    'api/query',
    'talent/notifications',
    'talent/tracker/views'
], function(
    _,
    notifications,
    mediator,
    api,
    api_query,
    talent_notifications,
    tracker_views) {

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
                //var collection = new api.ApplicationCollection();
                this.collection = new api.LocationCollection();
                //this.collection.fetch();
                if(notification.options.query) {
                    this.query = api_query.ApiQuery.parse(
                            this.collection,
                            notification.options.query);
                } else {
                    this.query = this.collection.query();
                }

                this.collection.on('reset', this.onReset, this);

                this.view = new tracker_views.TrackerView({
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

    return {
        TrackerMediator: TrackerMediator
    };
});
