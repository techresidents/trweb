define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'events',
    'ui',
    'widget',
    './forms',
    'text!./templates/nav.html',
    'text!./templates/edit_general.html',
    'text!./templates/edit_preferences.html',
    'text!./templates/edit_skills.html',
    'text!./templates/general.html',
    'text!./templates/preferences.html',
    'text!./templates/reels.html',
    'text!./templates/progress.html',
    'text!./templates/profile.html',
    'text!./templates/spotlight.html'

], function(
    $,
    _,
    Backbone,
    core,
    api,
    events,
    ui,
    widget,
    forms,
    nav_template,
    edit_general_template,
    edit_preferences_template,
    edit_skills_template,
    general_template,
    preferences_template,
    reels_template,
    progress_template,
    profile_template,
    spotlight_template) {

    var DeveloperProfileNavView = ui.template.views.TemplateView.extend({

       /**
        * Developer Profile Nav View
        * @constructor
        * @param {Object} options
        * @classdesc
        * View to display nav panel to various parts of the user's profile
        */
        initialize: function(options) {
            options = _.extend({
                template:  nav_template,
               classes:  ['developer-profile-nav']
            }, options);
            DeveloperProfileNavView.__super__.initialize.call(this, options);
        }
    });

    var DeveloperProfileGeneralView = ui.template.views.TemplateView.extend({

        buttonGroupSelector: '.btn-group button',

        events: {
            'click .active-job-hunt':   'onClickActiveJobHunt',
            'click .inactive-job-hunt': 'onClickInactiveJobHunt'
        },

        /**
         * Developer Profile General View
         * @constructor
         * @param {Object} options
         * @param {DeveloperProfile} options.model DeveloperProfile model
         * This view is dumb and expects the model to be loaded.
         * @classdesc
         * View to display user's general prefs.
         */
        initialize: function(options) {
            options = _.extend({
                template:  general_template,
                classes:  ['developer-profile-general'],
                model: this.model
            }, options);
            DeveloperProfileGeneralView.__super__.initialize.call(this, options);

            //child views
            this.jobHuntHelpView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [this.jobHuntHelpView];
        },

        initChildViews: function() {
            this.jobHuntHelpView = new ui.help.views.HelpView({
                help: 'Set if actively seeking new job opportunities',
                placement: 'bottom',
                iconClasses: 'icon-question-sign'
            });
        },

        render: function() {
            DeveloperProfileGeneralView.__super__.render.call(this, {});
            this.append(this.jobHuntHelpView, '.developer-profile-job-hunt-help');
            return this;
        },

        onClickActiveJobHunt: function() {
            if (!this.model.get_actively_seeking()) {
                this.model.set('actively_seeking', true);
                this.triggerEvent(events.UPDATE_DEVELOPER_PROFILE, {
                    model: this.model
                });
            }
        },

        onClickInactiveJobHunt: function() {
            if (this.model.get_actively_seeking()) {
                this.model.set('actively_seeking', false);
                this.triggerEvent(events.UPDATE_DEVELOPER_PROFILE, {
                    model: this.model
                });
            }
        }
    });

    var DeveloperProfilePreferencesView = ui.template.views.TemplateView.extend({

        /**
         * Developer Profile Preferences View
         * @constructor
         * @param {Object} options
         * @param {User} options.model User model
         * This view is dumb and expects the model to be loaded with
         * position_prefs, location_prefs, and technology_prefs.
         * @classdesc
         * View to display user's job preferences.
         */
        initialize: function(options) {
            options = _.extend({
                template:  preferences_template,
                classes:  ['developer-profile-preferences'],
                model: this.model,
                // Specify the withRelated data that has been loaded so that
                // it'll be converted to JSON and accessible within the template
                modelWithRelated: [
                    'position_prefs',
                    'technology_prefs__technology',
                    'location_prefs__location'
                ]
            }, options);
            DeveloperProfilePreferencesView.__super__.initialize.call(this, options);
        }
    });

    var DeveloperProfileReelsView = ui.template.views.TemplateView.extend({

        /**
         * Developer Profile Reels View
         * @constructor
         * @param {Object} options
         * @param {User} options.model User model
         * This view is dumb and expects the model to be loaded with
         * chat_reels__chat__topic.
         * @classdesc
         * View to display user's highlight reel chats.
         */
        initialize: function(options) {
            options = _.extend({
                template:  reels_template,
                classes:  ['developer-profile-reel'],
                model: this.model,
                // Specify the withRelated data that has been loaded so that
                // it'll be converted to JSON and accessible within the template
                modelWithRelated: ['chat_reels__chat__topic']
            }, options);
            DeveloperProfileReelsView.__super__.initialize.call(this, options);
        }
    });

    var DeveloperProfileProgressView = core.view.View.extend({

        /**
         * Developer Profile Progress View
         * @constructor
         * @param {Object} options
         * @param {User} options.model User model
         * @classdesc
         * View to compute and display profile completion
         */
        initialize: function(options) {
            this.template = _.template(progress_template);
            this.model = options.model;
            this.modelWithRelated = [
                'chat_reels__chat__topic',
                'skills__technology',
                'position_prefs',
                'technology_prefs__technology',
                'location_prefs__location',
                'developer_profile'
            ];

            //loader
            this.loader = new api.loader.ApiLoader([
                { instance: this.model, withRelated: this.modelWithRelated}
            ]);

            //bind events
            this.listenTo(this.loader, 'loaded', this.render);

            //load data
            this.loader.load();
        },

        classes: function() {
            return ['developer-profile-progress'];
        },

        render: function() {
            if (this.loader.isLoaded()) {
                var context = {
                    progress: this.computeProfileCompletion(),
                    eligible: this.isEligibleToReceiveOffers()
                };
                this.$el.html(this.template(context));
                this.$el.attr('class', this.classes().join(' '));
            }
            return this;
        },

        computeProfileCompletion: function() {
            // 10% minimum
            var progress = 10;
            // Position prefs
            if (this.model.get_position_prefs().length) {
                progress += 10;
            }
            // Location prefs
            if (this.model.get_location_prefs().length) {
                progress += 10;
            }
            // Technology prefs
            if (this.model.get_technology_prefs().length) {
                progress += 10;
            }
            // Skills
            if (this.model.get_skills().length) {
                progress += 25;
            }
            // Chats
            if (this.model.get_chat_reels().length) {
                progress += 35;
            }
            return progress;
        },

        isEligibleToReceiveOffers: function() {
            var isEligible = false;
            if (this.model.get_chat_reels().length) {
                isEligible = true;
            }
            return isEligible;
        }
    });

    var DeveloperProfileSpotlightView = core.view.View.extend({

        /**
         * Developer Profile Spotlight View
         * @constructor
         * @param {Object} options
         * @param {SpotlightlChatCollection} options.collection
         *   SpotlightChat collection
         * @param {PlayerState} options.playerState PlayerState model
         */
        initialize: function(options) {
            this.template = _.template(spotlight_template);
            this.collection = options.collection;
            this.collection.slice(0, 5);
            this.playerState = options.playerState;
            this.collectionWithRelated = ['chat__topic'];

            //loader
            this.loader = new api.loader.ApiLoader([
                { instance: this.collection, withRelated: this.collectionWithRelated}
            ]);

            //bind events
            this.listenTo(this.loader, 'loaded', this.render);

            //load data
            this.loader.load();

            //child views
            this.collectionView = null;
            this.helpView = null;
            this.initChildViews();
            this.initialized = true;
        },

        initChildViews: function() {
            var that = this;
            var viewFactory = new core.factory.FunctionFactory(function(options) {
                return new widget.playback.views.PlaybackBriefView({
                    model: options.model.get_chat(),
                    playerState: that.playerState,
                    context: function(view) {
                        return {
                            href: '/d/topic/' + view.model.get_topic_id()
                        };
                    }
                });
            });

            this.collectionView = new ui.collection.views.CollectionView({
                collection: this.collection,
                viewFactory: viewFactory
            });

            this.helpView = new ui.help.views.HelpView({
                help: 'Spotlight chats are chats by fellow developers which you ' +
                      'can listen to get a feel for what chats are all about.',
                placement: 'top',
                iconClasses: 'icon-question-sign'
            });
        },

        childViews: function() {
            return [this.collectionView];
        },

        classes: function() {
            return ['developer-profile-spotlight'];
        },

        render: function() {
            if (this.initialized && this.loader.isLoaded()) {
                var context = {};
                this.$el.html(this.template(context));
                this.$el.attr('class', this.classes().join(' '));
                this.append(this.collectionView, '.developer-profile-spotlight-hook');
                this.append(this.helpView, '.developer-profile-spotlight-help-hook');
            }
            return this;
        }
    });

    var DeveloperProfileGeneralEditView = core.view.View.extend({

        events: {
        },

        /**
         * Developer Profile General Edit View
         * @constructor
         * @param {Object} options
         * @param {User} options.model User model
         * @classdesc
         * View to edit general preferences
        */
        initialize: function(options) {
            this.template = _.template(edit_general_template);
            this.model = options.model;
            this.modelWithRelated = ['developer_profile'];

            //loader
            this.loader = new api.loader.ApiLoader([
                { instance: this.model, withRelated: this.modelWithRelated}
            ]);

            //bind events
            this.listenTo(this.loader, 'loaded', this.render);

            //load data
            this.loader.load();

            //child views
            this.formView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [this.formView];
        },

        initChildViews: function() {
            this.formView = new forms.GeneralFormView({
                model: this.model.get_developer_profile()
            });
        },

        classes: function() {
            return ['developer-profile-edit-general'];
        },

        render: function() {
            this.$el.html(this.template());
            this.$el.attr('class', this.classes().join(' '));
            if (this.loader.isLoaded()) {
                this.append(this.formView, '.developer-profile-general-form');
            }
            return this;
        }
    });

    var DeveloperProfilePreferencesEditView = core.view.View.extend({

        events: {
        },

        /**
         * Developer Profile Preferences Edit View
         * @constructor
         * @param {Object} options
         * @param {User} options.model User model
         * @classdesc
         * View to edit position, location, and technology preferences
        */
        initialize: function(options) {
            this.template = _.template(edit_preferences_template);
            this.model = options.model;
            this.modelWithRelated = [
                'position_prefs',
                'technology_prefs__technology',
                'location_prefs__location'
            ];

            //loader
            this.loader = new api.loader.ApiLoader([
                { instance: this.model, withRelated: this.modelWithRelated}
            ]);

            //bind events
            this.listenTo(this.loader, 'loaded', this.render);

            //load data
            this.loader.load();

            //child views
            this.formView = null;
            this.initChildViews();
        },
        
        childViews: function() {
            return [this.formView];
        },

        initChildViews: function() {
            this.formView = new forms.PreferencesFormView({
                model: this.model
            });
        },

        classes: function() {
            return ['developer-profile-edit-pref'];
        },
        
        render: function() {
            this.$el.html(this.template());
            this.$el.attr('class', this.classes().join(' '));
            if(this.loader.isLoaded()) {
                this.append(this.formView, '.developer-profile-pref-form');
            }
            return this;
        }
    });

    var DeveloperProfileSkillsEditView = core.view.View.extend({

        events: {
        },

        /**
         * Developer Profile Skills Edit View
         * @constructor
         * @param {Object} options
         * @param {User} options.model User model
         * @classdesc
         * View to edit skills
        */
        initialize: function(options) {
            this.template = _.template(edit_skills_template);
            this.model = options.model;
            this.modelWithRelated = ['skills__technology'];

            //loader
            this.loader = new api.loader.ApiLoader([
                { instance: this.model, withRelated: this.modelWithRelated}
            ]);

            //bind events
            this.listenTo(this.loader, 'loaded', this.render);

            this.loader.load();

            //child views
            this.formView = null;
            this.initChildViews();
        },
        
        childViews: function() {
            return [this.formView];
        },

        initChildViews: function() {
            this.formView = new forms.SkillsFormView({
                model: this.model
            });
        },

        classes: function() {
            return ['developer-profile-edit-skills'];
        },
        
        render: function() {
            this.$el.html(this.template());
            this.$el.attr('class', this.classes().join(' '));
            if(this.loader.isLoaded()) {
                this.append(this.formView, '.developer-profile-skills-form');
            }
            return this;
        }
    });

    var DeveloperProfileView = core.view.View.extend({

        generalViewSelector: '.developer-profile-general-hook',
        preferencesViewSelector: '.developer-profile-prefs-hook',
        skillsViewSelector: '.developer-profile-skills-hook',
        reelViewSelector: '.developer-profile-reel-hook',
        progressViewSelector: '.developer-profile-progress-hook',
        spotlightViewSelector: '.developer-profile-spotlight-hook',

        /**
         * Developer Profile View.
         * @constructor
         * @param {Object} options
         * @param {User} options.model User model
         * @param {PlayerState} options.playerState PlayerState model
         * @classdesc
         * View to display user's profile
        */
        initialize: function(options) {
            this.model = options.model;
            this.playerState = options.playerState;
            this.template = _.template(profile_template);
            this.modelWithRelated = [
                'chat_reels__chat__topic',
                'skills__technology',
                'position_prefs',
                'technology_prefs__technology',
                'location_prefs__location',
                'developer_profile'
            ];
            this.loader = new api.loader.ApiLoader([
                {instance: this.model, withRelated: this.modelWithRelated}
            ]);

            // bindings
            this.listenTo(this.loader, 'loaded', this.render);

            // load data
            this.loader.load();

            //child views
            this.generalView = null;
            this.preferencesView = null;
            this.skillsView = null;
            this.reelsView = null;
            this.progressView = null;
            this.spotlightView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [
                this.generalView,
                this.preferencesView,
                this.skillsView,
                this.reelsView,
                this.progressView,
                this.spotlightView
            ];
        },

        initChildViews: function() {
            this.generalView = new DeveloperProfileGeneralView({
                model: this.model.get_developer_profile()
            });
            this.preferencesView = new DeveloperProfilePreferencesView({
                model: this.model
            });
            this.skillsView = new widget.skill.views.SkillsView({
                collection: this.model.get_skills()
            });
            this.reelsView = new DeveloperProfileReelsView({
                model: this.model
            });
            this.progressView = new DeveloperProfileProgressView({
                model: this.model
            });
            this.spotlightView = new DeveloperProfileSpotlightView({
                collection: new api.models.SpotlightChatCollection(),
                playerState: this.playerState
            });
        },

        classes: function() {
            return ['developer-profile'];
        },

        render: function() {
            if (this.loader.isLoaded()) {
                var context = {
                    fmt: this.fmt,
                    model: this.model.toJSON({
                        withRelated: this.modelWithRelated
                    })
                };
                this.$el.html(this.template(context));
                this.$el.attr('class', this.classes().join(' '));
                this.append(this.generalView, this.generalViewSelector);
                this.append(this.preferencesView, this.preferencesViewSelector);
                this.append(this.skillsView, this.skillsViewSelector);
                this.append(this.reelsView, this.reelViewSelector);
                this.append(this.progressView, this.progressViewSelector);
                this.append(this.spotlightView, this.spotlightViewSelector);
            }
            return this;
        }
    });

    return {
        DeveloperProfileNavView: DeveloperProfileNavView,
        DeveloperProfileGeneralEditView: DeveloperProfileGeneralEditView,
        DeveloperProfilePreferencesEditView: DeveloperProfilePreferencesEditView,
        DeveloperProfileSkillsEditView: DeveloperProfileSkillsEditView,
        DeveloperProfileView: DeveloperProfileView
    };
});
