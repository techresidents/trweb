define([
    'jquery',
    'underscore',
    'core/view',
    'ui/grid/views'
], function(
    $,
    _,
    view,
    grid_views) {

    /**
     * Tracker Grid view.
     * @constructor
     * @param {Object} options
     *   collection: {ApplicationCollection} collection (required)
     *   query: {ApiQuery} query (required)
     */
    var TrackerGridView = grid_views.GridView.extend({

        initialize: function(options) {
            options = _.extend({
                config: TrackerGridView.config()
            }, options);

            grid_views.GridView.prototype.initialize.call(this, options);
        }
    }, {
        config: function() {
            var config = {
                columns: [
                    TrackerGridView.statusColumn(),
                    TrackerGridView.requisitionColumn(),
                    TrackerGridView.userColumn(),
                    TrackerGridView.createdColumn(),
                    TrackerGridView.actionColumn()
                ]
            };
            return config;
        },
        
        statusColumn: function() {
            return   {
                column: 'Status',
                headerCellView: new grid_views.GridHeaderCellView.Factory({
                    sort: 'status'
                }),
                cellView: new grid_views.GridCellView.Factory({
                    valueAttribute: 'status'
                })
            };
        },

        requisitionColumn: function() {
            return {
                column: 'Requisition',
                headerCellView: new grid_views.GridHeaderCellView.Factory({
                    sort: 'requisition__title'
                }),
                cellView: new grid_views.GridCellView.Factory({
                    valueAttribute: 'requisition__title'
                })
            };
        },

        userColumn: function() {
            return {
                column: 'User',
                cellView: new grid_views.GridLinkCellView.Factory(function(options) {
                    return {
                        href: '/talent/user/' + options.model.get_user_id(),
                        value: options.model.get_user_id()
                    };
                })
            };
        },

        createdColumn: function() {
            return {
                column: 'Created',
                headerCellView: new grid_views.GridHeaderCellView.Factory({
                    sort: 'created'
                }),
                cellView: new grid_views.GridDateCellView.Factory({
                    valueAttribute: 'created',
                    format: 'MM/dd/yy'
                })
            };
        },

        actionColumn: function() {
            var map = function(model) {
                return [
                    {key: 'open', label: 'Open', handler: function() {console.log('blah');}},
                    {key: 'divider'},
                    {key: 'close', label: 'Close'}
                ];
            };

            return {
                column: '',
                cellView: new grid_views.GridActionCellView.Factory({
                    map: map
                })
            };
        }
    });

    return {
        TrackerGridView: TrackerGridView
    };
});
