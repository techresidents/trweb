define([
    'underscore',
    'notifications',
    'core',
    'api',
    './views'
], function(
    _,
    notifications,
    core,
    api,
    profile_views) {

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

        createGeneralView: function() {
            var view = new profile_views.DeveloperProfileGeneralView({
                model: new api.models.User({ id: 'CURRENT' })
            });
            return view;
        },

        createPreferencesView: function() {
            var view = new profile_views.DeveloperProfilePreferencesView({
                model: new api.models.User({ id: 'CURRENT' })
            });
            return view;
        },

        createSkillsView: function() {
            var view = new profile_views.DeveloperProfileSkillsView({
                model: new api.models.User({ id: 'CURRENT' })
            });
            return view;
        },

        onCreateView: function(notification) {
            if(this.isViewType(notification.type)) {
                var view;
                switch(notification.type) {
                    case DeveloperProfileMediator.VIEW_TYPE.GENERAL:
                        view = this.createGeneralView();
                        break;
                    case DeveloperProfileMediator.VIEW_TYPE.PREFERENCES:
                        view = this.createPreferencesView();
                        break;
                    case DeveloperProfileMediator.VIEW_TYPE.SKILLS:
                        view = this.createSkillsView();
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
                if(this.view === notification.view) {
                    this.view = null;
                }
            }
        }

    }, {

        NAME: 'DeveloperProfileMediator',
        
        VIEW_TYPE: {
            GENERAL: 'DeveloperProfileGeneralView',
            PREFERENCES: 'DeveloperProfilePreferencesView',
            SKILLS: 'DeveloperProfileSkillsView'
        }
    });

    return {
        DeveloperProfileMediator: DeveloperProfileMediator
    };
});
