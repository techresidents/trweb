define([
    'jquery',
    'underscore',
    'core/view',
    'api/models',
    'grid/views',
    'paginator/views',
    'text!talent/tracker/templates/tracker.html'
], function(
    $,
    _,
    view,
    api,
    grid_views,
    paginator_views,
    tracker_template) {

    var EVENTS = {
        QUERY_CHANGED: 'TRACKER_QUERY_CHANGED_EVENT'
    };

    var TestView = view.View.extend({

        defaultTemplate: '<p>Status is <%= status %></p>',

        initialize: function(options) {
            this.template = _.template(this.defaultTemplate);
            this.model = options.model;
        },

        render: function() {
            var context = this.model.toJSON();
            this.$el.html(this.template(context));
            return this;
        }
    });

    /**
     * Tracker view.
     * @constructor
     * @param {Object} options
     *   collection: {ApplicationCollection} collection (required)
     *   query: {ApiQuery} query (required)
     */
    var TrackerView = view.View.extend({
            
        events: {
        },

        childViews: function() {
            return [this.gridView];
        },

        initialize: function(options) {
            this.template =  _.template(tracker_template);
            //this.collection = options.collection;
            //this.collection = new api.LocationCollection();
            this.collection = options.collection;
            this.query = options.query;

            /*
            this.config = [

                {
                    column: 'Status',
                    headerCellView: { options: { sort: 'status' } },
                    cellView: { options: { valueAttribute: 'status' } },
                    hoverView: { ctor: TestView }
                },
                {
                    column: 'Req Status',
                    headerCellView: { options: { sort: 'requisition__status' } },
                    cellView: { options: { valueAttribute: 'requisition__status' } }
                },

                {
                    column: 'User',
                    cellView: {
                        ctor: grid_views.GridLinkCellView,
                        options: function(model) {
                            return {
                                href: '/talent/user/' + model.get_user_id(),
                                value: model.get_user_id()
                            };
                        }
                    }
                },

                {
                    column: '',
                    cellView: {
                        ctor: grid_views.GridActionCellView,
                        options: function(model) {
                            return {
                                actions: [
                                    {key: 'open', label: 'Open', handler: function() {console.log('blah');}},
                                    {key: 'divider'},
                                    {key: 'close', label: 'Close'}
                                ]
                            };
                            
                        }
                    }
                }
            ];
            */
            
            /*
            this.config = {
                rowView: {
                    ctor: grid_views.GridLinkRowView,
                    options: { href: '/talent/tracker' }
                },

                columns: [
                    {
                        column: 'Technology',
                        cellView: { options: { valueAttribute: 'technology__name' } }
                    },
                    {
                        column: 'Description',
                        cellView: { options: { valueAttribute: 'technology__description' } }
                    }
                ]
            };
            */
            
            this.config = {
                columns: [
                    {
                        column: 'City',
                        headerCellView: { options: { sort: 'city' } },
                        cellView: { options: { valueAttribute: 'city' } }
                    },
                    {
                        column: 'State',
                        headerCellView: { options: { sort: 'state' } },
                        cellView: { options: { valueAttribute: 'state' } }
                    },

                    {
                        column: 'Zip',
                        cellView: { ctor: grid_views.GridLinkCellView, options: { valueAttribute: 'zip' } }
                    }
                ]
            };
        },
        
        render: function() {
            //this.query = this.collection.withRelated('requisition');
            //this.query = this.collection.filterBy({'city__in': 'Boston,San Francisco'}).slice(0, 10);
            //this.query = this.query.withRelated('technology');
            this.$el.html(this.template());
            this.gridView = new grid_views.GridView({
                config: this.config,
                collection: this.collection,
                query: this.query
            }).render();
            this.$('.content').append(this.gridView.el);

            this.paginatorView = new paginator_views.PaginatorView({
                maxPages: 10,
                collection: this.collection,
                query: this.query
            }).render();
            this.$('.content').append(this.paginatorView.el);

            return this;
        }
    });

    return {
        EVENTS: EVENTS,
        TrackerView: TrackerView
    };
});
