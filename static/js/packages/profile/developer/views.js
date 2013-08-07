define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'ui',
    './forms',
    'text!./templates/general.html',
    'text!./templates/nav.html',
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
    general_template,
    nav_template,
    preferences_template,
    skills_template,
    profile_template) {


    /**
     * Developer Profile Nav View
     * @constructor
     * @param {Object} options
     */
    var DeveloperProfileNavView = ui.template.views.TemplateView.extend({

        initialize: function(options) {
            options = _.extend({
                template:  nav_template,
               classes:  ['developer-profile-nav']
            }, options);
            DeveloperProfileNavView.__super__.initialize.call(this, options);
        }
    });

    /**
     * Developer Profile General View
     * @constructor
     * @param {Object} options
     */
    var DeveloperProfileGeneralView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.template = _.template(general_template);
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
     * Developer Profile Preferences View
     * @constructor
     * @param {Object} options
     */
    var DeveloperProfilePreferencesView = core.view.View.extend({

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
    var DeveloperProfileSkillsView = core.view.View.extend({

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

        initialize: function(options) {
            this.model = options.model;
            this.template = _.template(profile_template);
            this.modelWithRelated = [];
            this.loader = new api.loader.ApiLoader([
                {instance: this.model, withRelated: this.modelWithRelated}
            ]);

            // bindings
            this.listenTo(this.loader, 'loaded', this.render);

            // load data
            this.loader.load();
        },

        classes: function() {
            return ['developer-profile'];
        },

        render: function() {
            var context = {
                fmt: this.fmt,
                model: this.model.toJSON({
                    withRelated: this.modelWithRelated
                })
            };
            if (this.loader.isLoaded()) {
                this.$el.html(this.template(context));
                this.$el.attr('class', this.classes().join(' '));
            }
            return this;
        }
    });

    return {
        DeveloperProfileNavView: DeveloperProfileNavView,
        DeveloperProfileGeneralView: DeveloperProfileGeneralView,
        DeveloperProfilePreferencesView: DeveloperProfilePreferencesView,
        DeveloperProfileSkillsView: DeveloperProfileSkillsView,
        DeveloperProfileView: DeveloperProfileView
    };
});
