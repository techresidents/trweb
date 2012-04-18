define([
    'jQuery',
    'Underscore',
    'Backbone',
    'chat/models',
    'chat/messages',
], function($, _, Backbone, models, messages) {

    var ChatAgendaTabView = Backbone.View.extend({

            initialize: function() {
            },
    });

    return {
        ChatAgendaTabView: ChatAgendaTabView,
    }
});
