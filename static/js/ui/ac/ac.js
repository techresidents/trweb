define(/** @exports ui/ac/ac */[
    'jquery',
    'underscore',
    'core/string',
    'core/view'
], function(
    $,
    _,
    core_string,
    view) {

    var AutoCompleteView = view.View.extend(
    /** @lends module:ui/ac/ac~AutoCompleteView.prototype */ {
        
        /**
         * AutoCompleteView constructor
         * @constructor
         * @augments module:core/view~View
         * @param {object} options Options object
         */
        initialize: function(options) {
        }
    });

    return {
        AutoCompleteView: AutoCompletView
    };

});
