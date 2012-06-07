define([
    'Underscore',
    'core/command',
    'chat/message/messages',
    'chat/message/models',
    'chat/minute/proxies',
    'chat/tag/models',
], function(
    _,
    command,
    messages,
    message_models,
    minute_proxies,
    tag_models) {
    
    /**
     * Create Tag Command
     * @constructor
     *
     * Create a new chat Tag by sending a ChatMessage
     * with TagCreateMessage body.
     */
    var CreateTagCommand = command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],

        /**
         * Execute command
         * @param {Object} options
         *   {string} name tag name
         *   {number} minuteId
         *   {function} onSuccess optional success callback
         *   {function} onError optional error callback
         *   {Object} context optional callback context
         */
        execute: function(options) {
            var minutesProxy = this.facade.getProxy(minute_proxies.ChatMinutesProxy.NAME);
            var activeMinute = minutesProxy.collection.active();

            if(activeMinute) {
                var tag = new tag_models.Tag({
                    name: options.name,
                    minuteId: activeMinute.id
                });

                var message = new message_models.ChatMessage({
                    header: new messages.MessageHeader(),
                    msg: new messages.TagCreateMessage(tag.attributes),
                });
                
                //send message
                message.save(null, {
                    success: _.bind(this.onSuccess, this),
                    error: _.bind(this.onError, this),
                });
            }

            return true;
        },

    });


    /**
     * Delete Tag Command
     * @constructor
     *
     * Delete a chat Tag by sending a ChatMessage
     * with TagCreateMessage body.
     */
    var DeleteTagCommand = command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],

        /**
         * Execute command
         * @param {Object} options
         *   {Tag} model tag model
         *   {function} onSuccess optional success callback
         *   {function} onError optional error callback
         *   {Object} context optional callback context
         */
        execute: function(options) {
            var minutesProxy = this.facade.getProxy(minute_proxies.ChatMinutesProxy.NAME);
            var activeMinute = minutesProxy.collection.active();

            if(activeMinute) {

                var message = new message_models.ChatMessage({
                    header: new messages.MessageHeader(),
                    msg: new messages.TagDeleteMessage(options.model.attributes)
                });

                message.save(null, {
                    success: _.bind(this.onSuccess, this),
                    error: _.bind(this.onError, this),
                });
            }

            return true;
        }
    });

    return {
        CreateTagCommand: CreateTagCommand,
        DeleteTagCommand: DeleteTagCommand,
    };
});
