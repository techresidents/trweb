define([
    'jquery',
    'underscore',
    'core',
    'api',
    'ui',
    'events',
    'widget',
    'text!./templates/applicant_tracker.html'
], function(
    $,
    _,
    core,
    api,
    ui,
    events,
    widget,
    applicant_tracker_template) {

    var UserApplicantTrackerView = core.view.View.extend({

        /**
         * User applicant tracker view
         * @constructs
         * @param {Object} options
         * @param {User} options.model User model
         */
        initialize: function(options) {
            this.template = _.template(applicant_tracker_template);
            this.model = options.model;
            this.session = this.model.session;
            this.currentUser = new api.models.User({id: 'CURRENT'});
            this.currentTenant = this.currentUser.get_tenant();
            this.applicationsLoaded = false;
            this.requisitionsLoaded = false;

            this.requisitions = this.currentTenant.get_requisitions();
            this.requisitionsQuery = this.requisitions.filterBy({
                status: 'OPEN'
            }).orderBy('created__desc');

            this.applications = this.currentTenant.get_applications();
            this.applicationsQuery = this.applications.filterBy({
                user__id: this.model.id,
                requisition__status: 'OPEN'
            }).orderBy('created__desc');
            this.applicationsKey = this.session.expandKey(
                    this.applications.key(),
                    this.applicationsQuery);
            
            //bind events
            //listen to session for our collection to be removed. This event will
            //be fired when a new application is created. When this happens we
            //should re-fetch the query to update the application briefs view.
            this.listenTo(this.session, 'remove:' + this.applicationsKey, this.onRemove);
            this.listenTo(this.applications, 'loaded', this.onApplicationsLoaded);

            //load data
            //TODO replace w/ loader when loader can support queries
            this.applicationsQuery.fetch({
                success: _.bind(function() {
                    this.applicationsLoaded = true;
                    this.render();
                }, this)
            });
            this.requisitionsQuery.fetch({
                success: _.bind(function() {
                    this.requisitionsLoaded = true;
                    this.render();
                }, this)
            });

            // init child views
            this.applicationBriefsView = null;
            this.initChildViews();
        },

        events: {
            'click .user-applicant-tracker-add': 'onClick'
        },

        childViews: function() {
            return [this.applicationBriefsView];
        },

        initChildViews: function() {
            this.applicationBriefsView =
                new widget.application.views.ApplicationBriefsView({
                    collection: this.applications
            });
        },

        context: function() {
            return {
                applications: this.applications.toJSON(),
                requisitions: this.requisitions.toJSON()
            };
        },

        render: function() {
            if(this.applicationsLoaded &&
               this.requisitionsLoaded &&
               this.applicationBriefsView) {
                var context = this.context();
                this.$el.html(this.template(context));

                //TODO replace with better solution
                //In the case where a requisition is closed
                //and the applications query is cached
                //you'll see application briefs for closed
                //requisitions. For now we don't add the
                //briefs view unless we have at least one
                //open req. This isn't a complete fix.
                if(this.requisitions.length) {
                    this.append(this.applicationBriefsView);
                }
            }
            return this;
        },

        onClick: function(e) {
            var modal = new widget.tracker.views.TrackUserModal({
                model: this.model
            });
            this.append(modal);
        },

        onRemove: function() {
            this.applicationsQuery.fetch();
        },

        onApplicationsLoaded: function(instance) {
            if(instance === this.applications) {
                this.render();
            }
        }
    });

    return {
        UserApplicantTrackerView: UserApplicantTrackerView
    };
});
