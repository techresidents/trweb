define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'ui',
    './forms',
    'text!./templates/account.html',
    'text!./templates/nav.html',
    'text!./templates/preferences.html',
    'text!./templates/skills.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    ui,
    forms,
    account_template,
    nav_template,
    preferences_template,
    skills_template) {


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
     * Developer Profile Account View
     * @constructor
     * @param {Object} options
     */
    var DeveloperProfileAccountView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.template = _.template(account_template);
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

            this.formView = new forms.AccountFormView({
                model: this.model
            });
        },

        classes: function() {
            return ['developer-profile-account'];
        },
        
        render: function() {
            this.$el.html(this.template());
            this.$el.attr('class', this.classes().join(' '));
            if(this.loader.isLoaded()) {
                this.append(this.navView, '.developer-profile-account-nav');
                this.append(this.formView, '.developer-profile-account-form');
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

    return {
        DeveloperProfileAccountView: DeveloperProfileAccountView,
        DeveloperProfilePreferencesView: DeveloperProfilePreferencesView,
        DeveloperProfileSkillsView: DeveloperProfileSkillsView
    };
});