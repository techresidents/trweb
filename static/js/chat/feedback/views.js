define([
    'jquery',
    'underscore',
    'core/view',
    'text!chat/feedback/templates/feedback_modal.html',
    'text!chat/feedback/templates/no_feedback_modal.html'
], function($, _, view, feedback_template, no_feedback_template) {

    /**
     * No Feedback Modal View.
     * @constructor
     * @param {Object} options
     *   {Feedback} model Chat Feedback model
     */
    var NoFeedbackModalView = view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.template = _.template(no_feedback_template);
        },

        render: function() {
            this.$el.html(this.template());
            return this;
        },

        onOk: function() {
            window.location = '/';
        }

    });

    /**
     * Feedback Modal View.
     * @constructor
     * @param {Object} options
     *   {Feedback} model Chat Feedback model
     */
    var FeedbackModalView = view.View.extend({

        formSelector: 'form',
        
        overallQualitySelector: '#overall_quality',

        technicalQualitySelector: '#technical_quality',

        events: {
        },

        initialize: function(options) {
            this.template = _.template(feedback_template);
            this.errors = {};
        },

        render: function() {
            this.$el.html(this.template({
                model: this.model.toJSON(),
                errors: this.errors
            }));

            //select current values
            this.$(this.overallQualitySelector).val(this.model.overallQuality());
            this.$(this.technicalQualitySelector).val(this.model.technicalQuality());

            return this;
        },

        submit: function() {
            this.$(this.formSelector).submit();
        },

        onSave: function() {
            var values = {
                overallQuality: this.$(this.overallQualitySelector).val(),
                technicalQuality: this.$(this.technicalQualitySelector).val()
            };

            var validation = this.model.validate(values);

            if(validation.status) {
                this.model.set(values);
                this.submit();
            } else {
                //updating model with invalid data
                //requires silent option to be true
                this.model.set(values, {silent: true});
                this.errors = validation.errors;
                this.render();
            }

            return validation.result;
        }

    });
    
    return {
        FeedbackModalView: FeedbackModalView,
        NoFeedbackModalView: NoFeedbackModalView
    };
});
