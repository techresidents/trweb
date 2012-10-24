define([
    'jQuery',
    'Underscore',
    'core/view',
    'text!talent/user/templates/user.html'
], function(
    $,
    _,
    view,
    user_template) {
    
    /**
     * User View Events
     */
    var EVENTS = {
    };

    /**
     * Talent user view.
     * @constructor
     * @param {Object} options
     *   model: {User} (required)
     */
    var UserView = view.View.extend({

        events: {
        },

        initialize: function() {
            this.template =  _.template(user_template);
            this.model.bind('change', this.render, this);
        },

        render: function() {
            if(this.model.has("first_name")) {
                this.$el.html(this.template(this.model.toJSON()));
            }
            return this;
        }
    });

    return {
        EVENTS: EVENTS,
        UserView: UserView
    };
});
