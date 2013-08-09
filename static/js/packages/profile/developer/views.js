define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'ui',
    './forms',
    'text!./templates/nav.html',
    'text!./templates/edit_general.html',
    'text!./templates/general.html',
    'text!./templates/preferences.html',
    'text!./templates/skills.html',
    'text!./templates/profile.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    ui,
    forms,
    nav_template,
    edit_general_template,
    general_template,
    preferences_template,
    skills_template,
    profile_template) {


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
        }
    });

    /**
     * Developer Profile General Edit View
     * @constructor
     * @param {Object} options
     */
    var DeveloperProfileGeneralEditView = core.view.View.extend({

        events: {
        },

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
            this.navView = null;
            this.formView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [this.navView, this.formView];
        },

        initChildViews: function() {
            this.navView = new DeveloperProfileNavView();

            this.formView = new forms.GeneralFormView({
                model: this.model
            });
        },

        classes: function() {
            return ['developer-profile-general'];
        },

        render: function() {
            this.$el.html(this.template());
            this.$el.attr('class', this.classes().join(' '));
            if(this.loader.isLoaded()) {
                this.append(this.navView, '.developer-profile-general-nav');
                this.append(this.formView, '.developer-profile-general-form');
            }
            return this;
        }
    });

    /**
     * Developer Profile Preferences Edit View
     * @constructor
     * @param {Object} options
     */
    var DeveloperProfilePreferencesEditView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.template = _.template(preferences_template);
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
            this.navView = null;
            this.formView = null;
            this.initChildViews();
        },
        
        childViews: function() {
            return [this.navView, this.formView];
        },

        initChildViews: function() {
            this.navView = new DeveloperProfileNavView();
            this.formView = new forms.PreferencesFormView({
                model: this.model
            });
        },

        classes: function() {
            return ['developer-profile-pref'];
        },
        
        render: function() {
            this.$el.html(this.template());
            this.$el.attr('class', this.classes().join(' '));
            if(this.loader.isLoaded()) {
                this.append(this.navView, '.developer-profile-pref-nav');
                this.append(this.formView, '.developer-profile-pref-form');
            }
            return this;
        }
    });

    /**
     * Developer Profile Skills View
     * @constructor
     * @param {Object} options
     */
    var DeveloperProfileSkillsEditView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.template = _.template(skills_template);
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
            this.navView = null;
            this.initChildViews();
        },
        
        childViews: function() {
            return [this.navView, this.formView];
        },

        initChildViews: function() {
            this.navView = new DeveloperProfileNavView();

            this.formView = new forms.SkillsFormView({
                model: this.model
            });
        },

        classes: function() {
            return ['developer-profile-skills'];
        },
        
        render: function() {
            this.$el.html(this.template());
            this.$el.attr('class', this.classes().join(' '));
            if(this.loader.isLoaded()) {
                this.append(this.navView, '.developer-profile-skills-nav');
                this.append(this.formView, '.developer-profile-skills-form');
            }
            return this;
        }
    });

    /**
     * Developer Profile View.
     * @constructor
     * @param {Object} options
     *   model: Requisition model (required)
     */
    var DeveloperProfileView = core.view.View.extend({

        generalViewSelector: '.developer-profile-general-hook',

        initialize: function(options) {
            this.model = options.model;
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
            this.seekingView = null;
            this.skillsView = null;
            this.reelView = null;
            this.initChildViews();
        },

        childViews: function() {
            return [
                this.generalView,
                this.seekingView,
                this.skillsView,
                this.reelView
            ];
        },

        initChildViews: function() {
            this.generalView = new DeveloperProfileGeneralView({
                model: this.model.get_developer_profile()
            });
        },

        classes: function() {
            return ['developer-profile'];
        },

        render: function() {
            if (this.loader.isLoaded()) {
                this.sortSkills();
                var context = {
                    fmt: this.fmt,
                    model: this.model.toJSON({
                        withRelated: this.modelWithRelated
                    }),
                    sortedSkills: this.sortSkills()
                };
                this.$el.html(this.template(context));
                this.$el.attr('class', this.classes().join(' '));
                this.append(this.generalView, this.generalViewSelector);
            }
            return this;
        },

        sortSkills: function() {
            var sortedSkills = [];
            var skills = this.model.get_skills().toJSON({withRelated: ['technology']});
            if (skills.length) {
                // copied the algorithm from search/views.js
                sortedSkills = _.sortBy(skills, function(skill) {
                    var expertise = 1;
                    var yrs_experience = skill.yrs_experience || 1;
                    switch(skill.expertise) {
                        case 'Proficient':
                            expertise = 2;
                            break;
                        case 'Expert':
                            expertise = 3;
                            break;
                    }
                    return -1 * (expertise*100 + yrs_experience);
                });
            }
            return sortedSkills;
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
