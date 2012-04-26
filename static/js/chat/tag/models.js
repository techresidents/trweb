define([
    'jQuery',
    'Underscore',
    'Backbone',
    'xd/xd',
    'xd/backbone',
    'chat/message/messages',
    'chat/user/models',
], function($, _, Backbone, xd, xdBackbone, messages, user) {
    
    var Tag = Backbone.Model.extend({
            
        idAttribute: "tagId",

        defaults: function() {
            return {
                tagId: null,
                userId: null,
                name: null,
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
                    name: this.msg.name,
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

        urlRoot: function() {
            return this.header.url() + this.msg.url();
        },

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

    var TagCollection = Backbone.Collection.extend({

        model: Tag,
        
        sync: xdBackbone.sync,
    });

    return {
        Tag: Tag,
        tagCollection: new TagCollection,
    };
});
