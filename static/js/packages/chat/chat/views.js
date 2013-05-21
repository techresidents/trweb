define([
    'jquery',
    'underscore',
    'backbone',
    'twilio',
    'core',
    'api',
    'text!./templates/chat.html'
], function(
    $,
    _,
    Backbone,
    Twilio,
    core,
    api,
    chat_template) {

    /**
     * Chat View
     * @constructor
     * @param {Object} options
     */
    var ChatView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.template = _.template(chat_template);
            this.model = options.model;
            this.credential = this.model.get_chat_credentials().first();
            this.withRelated = [
                'chat_participants',
                'topic__tree'
            ];

            //load data
            this.loader = new api.loader.ApiLoader([
                { instance: this.model, withRelated: this.withRelated }
            ]);
            this.loader.load();

            Twilio.Device.setup(this.credential.get_twilio_capability(), {
                debug: true
            });
            Twilio.Device.connect({
                chat_token: this.credential.get_token()
            });
            //child views
            
        },
        
        render: function() {
            return this;
        },

        onLoaded: function() {
        }

    });

    return {
        ChatView: ChatView
    };
});
