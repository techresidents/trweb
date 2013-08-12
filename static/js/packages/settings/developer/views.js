define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'ui',
    './forms',
    'text!./templates/account.html',
    'text!./templates/nav.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    ui,
    forms,
    account_template,
    nav_template) {


    /**
     * Developer Settings Nav View
     * @constructor
     * @param {Object} options
     */
    var DeveloperSettingsNavView = ui.template.views.TemplateView.extend({

        initialize: function(options) {
            options = _.extend({
                template:  nav_template,
               classes:  ['developer-settings-nav']
            }, options);
            DeveloperSettingsNavView.__super__.initialize.call(this, options);
        }
    });
    
    /**
     * Developer Settings Account View
     * @constructor
     * @param {Object} options
     */
    var DeveloperSettingsAccountView = core.view.View.extend({

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
            this.navView = new DeveloperSettingsNavView();

            this.formView = new forms.AccountFormView({
                model: this.model
            });
        },

        classes: function() {
            return ['developer-settings-account'];
        },
        
        render: function() {
            this.$el.html(this.template());
            this.$el.attr('class', this.classes().join(' '));
            if(this.loader.isLoaded()) {
                this.append(this.navView, '.developer-settings-account-nav');
                this.append(this.formView, '.developer-settings-account-form');
            }
            return this;
        }
    });

    return {
        DeveloperSettingsAccountView: DeveloperSettingsAccountView
    };
});
