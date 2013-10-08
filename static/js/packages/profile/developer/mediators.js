define([
    'underscore',
    'notifications',
    'ctrl',
    'core',
    'api',
    './views',
    './reel/views'
], function(
    _,
    notifications,
    ctrl,
    core,
    api,
    profile_views,
    reel_views) {

    /**
     * Developer Profile Mediator
     * @constructor
     */
    var DeveloperProfileMediator = core.mediator.Mediator.extend({
        name: function() {
            return DeveloperProfileMediator.NAME;
        },

        isViewType: function(type) {
            return _.contains(DeveloperProfileMediator.VIEW_TYPE, type);
        },

        /**
         * Notification handlers
         */
        notifications: [
            [notifications.VIEW_CREATE, 'onCreateView'],
            [notifications.VIEW_DESTROY, 'onDestroyView']
        ],

        initialize: function(options) {
        },

        createSummaryView: function() {
            var proxy = this.facade.getProxy(
                    ctrl.proxies.player.PlayerStateProxy.NAME);

            var view = new profile_views.DeveloperProfileView({
                model: new api.models.User({ id: 'CURRENT' }),
                playerState: proxy.model
            });
            return view;
        },

        createGeneralEditView: function() {
            var view = new profile_views.DeveloperProfileGeneralEditView({
                model: new api.models.User({ id: 'CURRENT' })
            });
            return view;
        },

        createPreferencesEditView: function() {
            var view = new profile_views.DeveloperProfilePreferencesEditView({
                model: new api.models.User({ id: 'CURRENT' })
            });
            return view;
        },

        createSkillsEditView: function() {
            var view = new profile_views.DeveloperProfileSkillsEditView({
                model: new api.models.User({ id: 'CURRENT' })
            });
            return view;
        },

        createReelEditView: function() {
            var view = new reel_views.ChatReelPageView({
                collection: new api.models.ChatReelCollection()
            });
            return view;
        },

        onCreateView: function(notification) {
            if(this.isViewType(notification.type)) {
                var view;
                switch(notification.type) {
                    case DeveloperProfileMediator.VIEW_TYPE.SUMMARY:
                        view = this.createSummaryView();
                        break;
                    case DeveloperProfileMediator.VIEW_TYPE.GENERAL:
                        view = this.createGeneralEditView();
                        break;
                    case DeveloperProfileMediator.VIEW_TYPE.PREFERENCES:
                        view = this.createPreferencesEditView();
                        break;
                    case DeveloperProfileMediator.VIEW_TYPE.SKILLS:
                        view = this.createSkillsEditView();
                        break;
                    case DeveloperProfileMediator.VIEW_TYPE.REEL:
                        view = this.createReelEditView();
                        break;
                }

                this.facade.trigger(notifications.VIEW_CREATED, {
                    type: notification.type,
                    view: view
                });
            }
        },

        onDestroyView: function(notification) {
            if(this.isViewType(notification.type)) {
                notification.view.destroy();

                this.facade.trigger(notifications.VIEW_DESTROYED, {
                    type: notification.type,
                    view: notification.view
                });
            }
        }

    }, {

        NAME: 'DeveloperProfileMediator',
        
        VIEW_TYPE: {
            SUMMARY: 'DeveloperProfileSummaryView',
            GENERAL: 'DeveloperProfileGeneralEditView',
            PREFERENCES: 'DeveloperProfilePreferencesEditView',
            REEL: 'DeveloperProfileReelEditView',
            SKILLS: 'DeveloperProfileSkillsEditView'
        }
    });

    return {
        DeveloperProfileMediator: DeveloperProfileMediator
    };
});
