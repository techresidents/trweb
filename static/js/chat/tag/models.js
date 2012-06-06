define([
    'jQuery',
    'Underscore',
    'Backbone',
    'xd/backbone',
    'chat/message/messages',
    'chat/message/models',
    'chat/user/models',
], function(
    $,
    _,
    Backbone,
    xdBackbone,
    messages,
    message_models,
    user) {
    
    /**
     * Chat Tag model.
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var Tag = message_models.ChatMessageBaseModel.extend({
            
        idAttribute: 'tagId',

        message: messages.TagCreateMessage,

        defaults: function() {
            return {
                tagId: null,
                userId: null,
                minuteId: null,
                name: null,
                tagReferenceId: null,
            };
        },
        
        userId: function() {
            return this.get('userId');
        },

        setUserId: function(userId) {
            this.set({userId: userId});
            return this;
        },

        name: function() {
            return this.get('name');
        },

        setName: function(name) {
            this.set({name: name});
            return this;
        },

        minuteId: function() {
            return this.get('minuteId');
        },

        setMinuteId: function(minuteId) {
            this.set({minuteId: minuteId});
            return this;
        },

        tagReferenceId: function() {
            return this.get('tagReferenceId');
        },

        setTagReferenceId: function(tagReferenceId) {
            this.set({tagReferenceId: tagReferenceId});
            return this;
        },
    });


    /**
     * Chat Tag collection.
     */
    var TagCollection = Backbone.Collection.extend({

        model: Tag,
        
        /**
         * Cross domain compatible sync.
         */
        sync: xdBackbone.sync,
    });

    return {
        Tag: Tag,
        TagCollection: TagCollection,
    };
});
