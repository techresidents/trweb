define([
    'underscore',
    'core/command'
], function(
    _,
    command) {
    
    /**
     * Create Tag Command
     * @constructor
     *
     * Create a new chat Tag by sending a ChatMessage
     * with TagCreateMessage body.
     */
    var ApplicationUpdateCommand = command.AsyncCommand.extend({

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
            var agendaProxy = this.facade.getProxy(agenda_proxies.ChatAgendaProxy.NAME);
            var activeMinute = agendaProxy.activeMinute();

            if(activeMinute) {
                var tag = new tag_models.Tag({
                    name: options.name,
                    tagReferenceId: options.tagReferenceId,
                    minuteId: activeMinute.id
                });

                var message = new message_models.ChatMessage({
                    header: new messages.MessageHeader(),
                    msg: new messages.TagCreateMessage(tag.attributes)
                });
                
                //send message
                message.save(null, {
                    success: _.bind(this.onSuccess, this),
                    error: _.bind(this.onError, this)
                });
            }

            return true;
        }

    });

    return {
        CreateTagCommand: CreateTagCommand,
        DeleteTagCommand: DeleteTagCommand
    };
});
