define([
    'order!3ps/raphael/raphael'
], function() {
    var Raphael = window.Raphael;
    // TODO Figure out a way to remove Raphael from the global namespace without breaking Raphael.
    // This issue is currently observed when drawing an arrow within the whiteboard.
    //window.Raphael = null;
    return Raphael;
});
