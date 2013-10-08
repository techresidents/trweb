define(/** @exports widget */[
    './application/handlers',
    './application/views',
    './offer/views',
    './playback/views',
    './skill/views',
    './tracker/views'
], function(
    application_handlers,
    application_views,
    offer_views,
    playback_views,
    skill_views,
    tracker_views) {
    
    return {
        application: {
            handlers: application_handlers,
            views: application_views
        },
        offer: {
            views: offer_views
        },
        playback: {
            views: playback_views
        },
        tracker: {
            views: tracker_views
        },
        skill: {
            views: skill_views
        }
    };
});
