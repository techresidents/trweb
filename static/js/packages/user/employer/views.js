define(/** @exports user/employer/views */[
    './action/views',
    './chat/views',
    './note/views',
    './offer/views',
    './pref/views',
    './skill/views',
    './tracker/views',
    './user/views'
], function(
    action_views,
    chat_views,
    note_views,
    offer_views,
    pref_views,
    skill_views,
    tracker_views,
    user_views) {

    return {
        action: action_views,
        chat: chat_views,
        note: note_views,
        offer: offer_views,
        pref: pref_views,
        skill: skill_views,
        tracker: tracker_views,
        user: user_views
    };
});
