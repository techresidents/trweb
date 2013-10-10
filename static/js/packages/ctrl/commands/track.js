define([
    'core',
    'notifications'
], function(
    core,
    notifications) {

    /**
     * Track Page View constructor
     * @constructor
     */
    var TrackPageView = core.command.Command.extend({

        /**
         * Execute Command
         * @param {object} options options object
         * @param {string} options.uri uri uri to track
         */
        execute: function(options) {
            //track in google analytics
            //replace ';' with '--' for ga since can't handle it
            var gaUri = options.uri.replace(/;/g, '--');
            _gaq.push(['_trackPageview', gaUri]);
            return true;
        }
    });

    /**
     * Track Event constructor
     * @constructor
     */
    var TrackEvent = core.command.Command.extend({

        /**
         * Execute Command
         * @param {object} options options object
         * @param {string} options.category event category
         * @param {string} options.action event action
         * @param {string} [options.label] event label
         * @param {integer} [options.value] event value
         */
        execute: function(options) {
            _gaq.push(['_trackEvent', options.category, options.action, options.label, options.value]);
            return true;
        }
    });

    return {
        TrackPageView: TrackPageView,
        TrackEvent: TrackEvent
    };
});
