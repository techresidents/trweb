define([
    'browser',
    'core',
    'notifications'
], function(
    browser,
    core,
    notifications) {

    /**
     * CheckFlashCompatibility constructor
     * @constructor
     * @classdesc
     * Check Flash compatibility
     */
    var CheckFlashCompatibility = core.command.Command.extend({

        /**
         * Execute Command
         * @param {object} options Options object
         * @param {number} options.majorVersion Minimum Flash major version
         * @param {number} options.minorVersion Minimum Flash minor version
         */
        execute: function(options) {
            var majorVersion = options.majorVersion;
            var minorVersion = options.minorVersion;

            var isFlashCompatible = browser.isFlashCompatible(
                majorVersion,
                minorVersion
            );

            if (!isFlashCompatible) {
                this.facade.trigger(notifications.ALERT, {
                        severity: 'warning',
                        message: 'Warning: This version of Flash is not ' +
                            'supported. Please upgrade to the latest version.'
                });
            }

            return true;
        }
    });

    /**
     * CheckBrowserCompatibility constructor
     * @constructor
     * @classdesc
     * Check browser compatibility
     */
    var CheckBrowserCompatibility = core.command.Command.extend({

        /**
         * Execute Command
         * @param {object} options Options object
         * @param {string} options.attribute browser name
         * @param {number} options.value minimum browser version
         * For example: {'chrome': 11, 'firefox': 3.6}
         */
        execute: function(options) {

            var browserCompatibility = browser.isBrowserCompatible(options);
            if (!browserCompatibility.isBrowserSupported) {
                this.facade.trigger(notifications.ALERT, {
                        severity: 'warning',
                        message: 'Warning: This browser is not supported. ' +
                            'Please use the latest version of Chrome, Firefox, ' +
                            'Safari, Opera, or Internet Explorer.'
                });
            } else if (!browserCompatibility.isBrowserVersionSupported) {
                this.facade.trigger(notifications.ALERT, {
                        severity: 'warning',
                        message: 'Warning: This browser version is not ' +
                            'supported. Please upgrade to the latest version.'
                });
            }

            return true;
        }
    });

    return {
        CheckBrowserCompatibility: CheckBrowserCompatibility,
        CheckFlashCompatibility: CheckFlashCompatibility
    };
});
