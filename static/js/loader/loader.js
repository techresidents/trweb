define([
    'order!3ps/jquery/jquery',
    'order!3ps/bootstrap/bootstrap',
    'order!3ps/underscore/underscore',
    'order!3ps/backbone/backbone',
    'order!3ps/highcharts/js/highcharts',
], function() {
    return {
        $ : jQuery.noConflict(),
        _ : _.noConflict(),
        Backbone: Backbone.noConflict(),
        Highcharts: window.Highcharts
    };
});
