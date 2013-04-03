define([
    'jquery',
    'underscore',
    'core/factory',
    'core/view',
    'ui/drop/views',
    'ui/grid/views',
    'ui/paginator/views',
    'talent/applicant/handler',
    'text!talent/applicant/log/templates/application_logs.html',
    'text!talent/applicant/log/templates/application_log_add.html'
], function(
    $,
    _,
    factory,
    view,
    drop_views,
    grid_views,
    paginator_views,
    handler,
    application_logs_template,
    application_log_add_template) {

    /**
     * Application Log Grid view.
     * @constructor
     * @param {Object} options
     *   collection: {ApplicationLogCollection} collection (required)
     *   query: {ApiQuery} query (required)
     */
    var ApplicationLogGridView = grid_views.GridView.extend({

        initialize: function(options) {
            var config = {
                columns: [
                    ApplicationLogGridView.noteColumn(),
                    ApplicationLogGridView.userColumn(),
                    ApplicationLogGridView.createdColumn()
                ]
            };

            options = _.extend({
                config: config
            }, options);

            grid_views.GridView.prototype.initialize.call(this, options);
        },

        classes: function() {
            var result = grid_views.GridView.prototype.classes.call(this);
            result = result.concat(['application-log-grid']);
            return result;
        }
    }, {
        userColumn: function() {
            return   {
                column: 'User',
                cellView: new grid_views.GridCellView.Factory(function(options) {
                    var user = options.model.get_user();
                    var fullName = user.get_first_name() + ' ' + user.get_last_name();
                    return {
                        value: fullName
                    };
                })
            };
        },

        noteColumn: function() {
            return {
                column: 'Note',
                cellView: new grid_views.GridCellView.Factory({
                    valueAttribute: 'note'
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
                    format: 'MM/dd/yy h:mm tt'
                })
            };
        }
    });

    /**
     * Application Log Add View
     */
    var ApplicationLogAddView = view.View.extend({

        /**
         * @constructs
         * @param {object} options Options object
         * @param {options.Application} model Application model
         */
        initialize: function(options) {
            this.model = options.model;
            this.template = _.template(application_log_add_template);
            this.handler = new handler.ApplicantHandler({
                model: this.model,
                view: this
            });
        },

        events: {
            'click .save': 'onSave',
            'click .cancel': 'onCancel'
        },

        classes: function() {
            return ['application-log-add'];
        },

        render: function() {
            this.$el.html(this.template());
            this.$el.attr('class', this.classes().join(' '));
            return this;
        },

        focus: function() {
            this.$('textarea').focus();
        },

        clear: function() {
            this.$('textarea').val(null);
        },

        onSave: function() {
            var note = this.$('textarea').val();
            if(note) {
                this.handler.createApplicationLog(note);
                this.clear();
            }
        },

        onCancel: function() {
            this.clear();
        }
    });

    /**
     * Application Logs View
     */
    var ApplicationLogsView = view.View.extend({

        /**
         * @constructs
         * @param {object} options Options object
         * @param {options.Application} model Application model
         */
        initialize: function(options) {
            options = _.extend({
                template: this.defaultTemplate,
                itemsPerPage: 5,
                maxPages: 5
            }, options);

            this.model = options.model;
            this.session = this.model.session;
            this.itemsPerPage = options.itemsPerPage;
            this.maxPages = options.maxPages;
            this.template = _.template(options.template);
            
            //query
            this.collection = this.model.get_application_logs().clone();
            this.query = this.collection
                .withRelated(['user'])
                .orderBy('created__desc')
                .slice(0, this.itemsPerPage);
            this.collectionKey = this.session.expandKey(
                    this.collection.key(),
                    this.query);
            
            //bind events
            this.listenTo(this.session, 'remove:' + this.collectionKey, this.onRemove);
            
            //fetch data
            this.query.fetch();

            //child views
            this.dropView = null;
            this.gridView = null;
            this.paginatorView = null;
            this.initChildViews();
        },

        defaultTemplate: application_logs_template,

        events: {
            'click .drop-button': 'onDropClick',
            'click .drop-content .cancel': 'onDropAction',
            'click .drop-content .save': 'onDropAction',
            'open .drop': 'onDropOpen'
        },

        childViews: function() {
            return [this.gridView, this.paginatorView, this.dropView];
        },

        initChildViews: function() {
            this.gridView = new ApplicationLogGridView({
                collection: this.collection,
                query: this.query
            });
            this.paginatorView = new paginator_views.PaginatorView({
                maxPages: this.maxPages,
                collection: this.collection,
                query: this.query
            });
            this.dropView = new drop_views.DropView({
                targetView: this,
                targetSelector: '.drop-button',
                view: new factory.Factory(ApplicationLogAddView, {
                    model: this.model
                })
            });
        },

        classes: function() {
            return ['application-log'];
        },

        render: function() {
            this.$el.html(this.template());
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.gridView);
            this.append(this.paginatorView);
            this.append(this.dropView);
            return this;
        },

        onRemove: function() {
            this.query.fetch();
        },

        onDropClick: function(e) {
            this.dropView.toggle();
        },

        onDropOpen: function(e) {
            this.dropView.childView.focus();
        },

        onDropAction: function(e) {
            this.dropView.close();
        }
    });

    return {
        ApplicationLogsView: ApplicationLogsView,
        ApplicationLogGridView: ApplicationLogGridView
    };
});
