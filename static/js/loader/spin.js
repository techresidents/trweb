define([
    '3ps/spin/spin'
], function() {
    var Spinner = window.Spinner;
    window.Spinner = null;

    return {
        Spinner: Spinner
    }
});
