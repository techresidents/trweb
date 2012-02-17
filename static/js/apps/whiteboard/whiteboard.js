define([
    'jQuery',
    'Underscore',
    'Backbone',
    'whiteboard/views'
], function($, _, Backbone, views) {

$(document).ready(function() {
    
    var ChatAppView = Backbone.View.extend({

            el: $("#whiteboard-app"),

            initialize: function() {
                var whiteboardView = new views.WhiteboardView({
                        el: $("#whiteboard"),
                        height: 400,
                        paperHeight: 768
                });

                var whiteboardToolView = new views.WhiteboardToolView({
                        el: $("#whiteboard-tools"),
                        whiteboard: whiteboardView
                });
            }
    });

    app = new ChatAppView();

});

    
});
