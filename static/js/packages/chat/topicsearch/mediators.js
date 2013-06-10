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
    topicsearch_views) {

    /**
     * TopicSearch Mediator
     * @constructor
     */
    var TopicSearchMediator = core.mediator.Mediator.extend({
        name: function() {
            return TopicSearchMediator.NAME;
        },

        viewType: function() {
            return TopicSearchMediator.VIEW_TYPE;
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
            this.defaultCollection = new api.models.TopicSearchCollection();
            this.defaultQuery = this.defaultCollection.slice(0, 10);

            this.collection = null;
            this.query = null;
        },

        onCreateView: function(notification) {
            if (notification.type === this.viewType()) {
                var uri = notification.options.query || this.defaultQuery.toUri();

                this.collection = this.defaultCollection.clone();
                this.collection.on('reset', this.onReset, this);
                this.query = api.query.ApiQuery.parse(this.collection, uri);

                this.view = new topicsearch_views.TopicSearchPageView({
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
            var uri = this.query.toUri();
            if (uri === this.defaultQuery.toUri()) {
                uri = null;
            }
            this.facade.trigger(notifications.VIEW_NAVIGATE, {
                type: TopicSearchMediator.VIEW_TYPE,
                query: uri,
                trigger: false
            });
        }

    }, {

        NAME: 'TopicSearchMediator',

        VIEW_TYPE: 'TopicSearchView'
    });

    return {
        TopicSearchMediator: TopicSearchMediator
    };
});