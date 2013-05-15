define([
], function() {

    var EventType = {
        /** Dispatched before component is shown */
        SHOW: 'show',

        /** Dispatched before component is hidden */
        HIDE: 'show',

        /** Dispatched before component is enabled */
        ENABLE: 'enable',

        /** Dispatched before component is disabled */
        DISABLE: 'disable',

        /** Dispatched before component is highlighted */
        HIGHLIGHT: 'highlight',

        /** Dispatched before component is unhighlighted */
        UNHIGHLIGHT: 'unhighlight',

        /** Dispatched before component is activated */
        ACTIVATE: 'activate',

        /** Dispatched before component is deactivated */
        DEACTIVATE: 'deactivate',

        /** Dispatched before component is selected */
        SELECT: 'select',

        /** Dispatched before component is unselected */
        UNSELECT: 'unselect',

        /** Dispatched before component is checked */
        CHECK: 'check',

        /** Dispatched before component is unchecked */
        UNCHECK: 'uncheck',

        /** Dispatched before component is opened */
        OPEN: 'open',

        /** Dispatched before component is closed */
        CLOSE: 'close',

        /** Dispatched afer external-facing state of component is changed */
        CHANGE: 'change'
    };

    return {
        EventType: EventType
    };

});
