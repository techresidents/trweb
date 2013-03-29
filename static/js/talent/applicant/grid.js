define([
    'jquery',
    'underscore',
    'core/view',
    'talent/events',
    'talent/applicant/handler',
    'ui/grid/views'
], function(
    $,
    _,
    view,
    talent_events,
    applicant_handler,
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
            var config = {
                columns: [
                    TrackerGridView.applicationColumn(),
                    TrackerGridView.requisitionColumn(),
                    TrackerGridView.userColumn(),
                    TrackerGridView.createdColumn(),
                    TrackerGridView.statusColumn(),
                    TrackerGridView.actionColumn(this)
                ]
            };

            options = _.extend({
                config: config
            }, options);

            grid_views.GridView.prototype.initialize.call(this, options);
        },

        classes: function() {
            var result = grid_views.GridView.prototype.classes.call(this);
            result = result.concat(['tracker-grid']);
            return result;
        }
    }, {
        applicationColumn: function() {
            return {
                column: 'Application',
                cellView: new grid_views.GridLinkCellView.Factory(function(options) {
                    return {
                        href: '/talent/application/' + options.model.id,
                        value: options.model.id
                    };
                })
            };
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
                cellView: new grid_views.GridLinkCellView.Factory(function(options) {
                    var requisition = options.model.get_requisition();
                    return {
                        href: '/requisition/view/' + requisition.id,
                        value: requisition.get_title()
                    };
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

        actionColumn: function(view) {
            var map = function(model) {
                handler = new applicant_handler.ApplicantHandler({
                    model: model,
                    view: view
                });
                return handler.menuItems();
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
