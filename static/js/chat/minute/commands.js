define([
    'Underscore',
    'core/command',
    'chat/message/messages',
    'chat/message/models',
    'chat/minute/models',
    'chat/minute/proxies',
], function(
    _,
    command,
    messages,
    message_models,
    minute_models,
    minute_proxies) {
    
    /**
     * Start Minute Command
     * @constructor
     *
     * Create and start a new chat Minute by sending a ChatMessage
     * with MinuteCreateMessage body.
     */
    var StartMinuteCommand = command.AsyncCommand.extend({
        
        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],

        /**
         * Execute command
         * @param {Object} options
         *   {integer} topicId
         *   {function} onSuccess optional success callback
         *   {function} onError optional error callback
         *   {Object} context optional callback context
         */
        execute: function(options) {

            var message = new message_models.ChatMessage({
                header: new messages.MessageHeader(),
                msg: new messages.MinuteCreateMessage({
                    topicId: options.topicId,
                }),
            });
            
            //send message
            message.save(null, {
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this),
            });

            return true;
        },

    });

    /**
     * End Minute Command
     * @constructor
     *
     * Update and end a chat Minute by sending a ChatMessage
     * with MinuteUpdateMessage body.
     */
    var EndMinuteCommand = command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],

        /**
         * Execute command
         * @param {Object} options
         *   {integer} minuteId not required if minute provided
         *   {Minute} minute not required if minuteId provided
         *   {function} onSuccess optional success callback
         *   {function} onError optional error callback
         *   {Object} context optional callback context
         */
        execute: function(options) {
            var minutesProxy = this.facade.getProxy(minute_proxies.ChatMinutesProxy.NAME);

            var minute;
            if(options.minuteId) {
                minute = minutesProxy.get(minuteId);
            } else {
                minute = options.minute;
            }

            if(minute) {
                var message = new message_models.ChatMessage({
                    header: new messages.MessageHeader(),
                    msg: new messages.MinuteUpdateMessage(minute.attributes),
                });
                
                //send message
                message.save(null, {
                    success: _.bind(this.onSuccess, this),
                    error: _.bind(this.onError, this),
                });
            }

            return true;
        }
    });

    return {
        StartMinuteCommand: StartMinuteCommand,
        EndMinuteCommand: EndMinuteCommand,
    };
});
