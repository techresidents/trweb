define([
    'order!3ps/jquery/jquery-min',
    'order!3ps/bootstrap/bootstrap-min',
    'order!3ps/underscore/underscore-min',
    'order!3ps/backbone/backbone-min',
    'order!3ps/backbone/localStorage-min',
    'order!3ps/highcharts/js/highcharts'
], function() {
    return {
        $ : jQuery.noConflict(),
        _ : _.noConflict(),
        Backbone: Backbone.noConflict(),
        Highcharts: window.Highcharts
    };
});
