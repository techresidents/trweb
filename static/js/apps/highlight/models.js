define([
    'jquery',
    'underscore',
    'backbone',
    'backbone.localStorage'
], function($, _, Backbone, none) {
    
    /**
     * Chat Session UI Model.
     * @constructor
     * @param {Object} attributes
     * @param {Object} options
     */
    var ChatSessionUIModel = Backbone.Model.extend({
        
        /**
         * Store model in local storage
         */
        localStorage: new Backbone.LocalStorage("ChatSessionUIModel"),

        defaults: function() {
            return {
                chatSession: null,
                selected: false
            };
        },

        chatSession: function() {
            return this.get('chatSession');
        },
        
        setChatSession: function(chatSession) {
            this.set({ chatSession: chatSession});
            return this;
        },

        selected: function() {
            return this.get('selected');
        },

        setSelected: function(selected) {
            this.set({ selected: selected });
            return this;
        },

        toJSON: function(withRelated) {
            return _.extend({}, {
                chatSession: this.chatSession() ? this.chatSession().toJSON(withRelated) : null,
                selected: this.selected()
            });
        }
    });


    return {
        ChatSessionUIModel: ChatSessionUIModel
    };
});
