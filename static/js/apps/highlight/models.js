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

        toJSON: function() {
            var result = {
                chatSession: null,
                selected: this.selected()
            };

            if(this.chatSession()) {
                result.chatSession = this.chatSession().toJSON({
                    withRelated: ['chat__topic']
                });
            }

            return result;
        }
    });


    return {
        ChatSessionUIModel: ChatSessionUIModel
    };
});
