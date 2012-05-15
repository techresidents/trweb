define([
    'jQuery',
    'Underscore',
    'Backbone',
    'xd/xd',
    'xd/backbone',
    'chat/message/messages',
    'chat/user/models',
], function($, _, Backbone, xd, xdBackbone, messages, user) {
    
    /**
     * Chat Tag model.
     * @constructor
     * @param {Object} attributes Optional model attributes.
     * @param {Object} options Optional options
     */
    var Tag = Backbone.Model.extend({
            
        idAttribute: 'tagId',

        defaults: function() {
            return {
                tagId: null,
                userId: null,
                minuteId: null,
                name: null,
                tagReferenceId: null,
            };
        },
        
        initialize: function(attributes, options) {
            var optionsProvided = false;

            if(options) {
                this.header = options.header;
                this.msg = options.msg;
                optionsProvided = true;
            } else {
                this.header = new messages.MessageHeader;
                this.msg = new messages.TagCreateMessage;
            }

            if(optionsProvided) {
                this.set({
                    tagId: this.msg.tagId,
                    userId: this.header.userId,
                    minuteId: this.msg.minuteId,
                    name: this.msg.name,
                    tagReferenceId: this.msg.tagReferenceId,
                });
            }
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

        urlRoot: function() {
            return this.header.url() + this.msg.url();
        },

        /**
         * Cross domain compatible sync.
         */
        sync: xdBackbone.sync,

        parse: function(response) {
            this.header = response.header;
            this.msg = response.msg;

            return {
                tagId: response.msg.tagId,
                userId: response.header.userId,
                name: response.msg.name,
            };
        },

        toJSON: function() {
            return _.extend(this.attributes, {
                myTag: this.userId() === user.currentUser.id
            });
        }
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
        tagCollection: new TagCollection,
    };
});
