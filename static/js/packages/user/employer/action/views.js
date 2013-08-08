define([
    'jquery',
    'underscore',
    'core',
    'api',
    'ui',
    'events',
    '../note/views',
    '../offer/views',
    '../tracker/views',
    'text!./templates/actions.html'
], function(
    $,
    _,
    core,
    api,
    ui,
    events,
    note_views,
    offer_views,
    tracker_views,
    actions_template) {

    var UserActionsView = ui.accordion.views.AccordionView.extend({

        /**
         * Constructor
         * @constructs
         * @param {Object} options
         * @param {User} options.model User model
         */
        initialize: function(options) {
            this.model = options.model;
            this.currentUser = new api.models.User({id: 'CURRENT'});

            options.config = {
                items: [
                    this.notesItem(),
                    this.trackerItem(),
                    this.offersItem()
                ]
            };

            UserActionsView.__super__.initialize.call(this, options);
        },

        notesItem: function() {
            var view = new note_views.UserNoteView({
                candidateModel: this.model
            });
            return {
                name: 'notes',
                title: 'Notes',
                viewOrFactory: view
            };
        },

        trackerItem: function() {
            var view = new tracker_views.UserApplicantTrackerView({
                model: this.model
            });
            return {
                name: 'tracker',
                title: 'Applicant Tracker',
                viewOrFactory: view
            };
        },

        offersItem: function() {
            var view = new offer_views.UserOffersView({
                model: this.model
            });
            return {
                name: 'offers',
                title: 'Offers',
                viewOrFactory: view
            };
        }

    });

    return {
        UserActionsView: UserActionsView
    };
});
