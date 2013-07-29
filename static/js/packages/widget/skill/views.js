define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'ui',
    'text!./templates/skill.html',
    'text!./templates/skill_drop.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    ui,
    skill_template,
    skill_drop_template) {
    
    /**
     * Skills View
     * @constructor
     * @param {Object} options
     */
    var SkillsView = ui.ac.views.MultiAutoCompleteView.extend({

        events: function() {
            return _.extend({
                'close .w-skill': 'onSkillClose'
            }, SkillsView.__super__.events);
        },

        initialize: function(options) {
            options.viewFactory = new SkillView.Factory();

            this.listenTo(this.collection, 'change', this.onChange);

            SkillsView.__super__.initialize.call(this, options);
        },

        initChildViews: function() {
            this.sort = _.bind(this.sortSkill, this);
            SkillsView.__super__.initChildViews.call(this);
            this.sort = null;
        },

        addMatch: function(match) {
            var model = SkillsView.__super__.addMatch.call(this, match);
            var view = this.modelViewMap[model.cid];

            //delay opeing skill drop view so we don't lose
            //focus to the autocomplete view
            setTimeout( function() {
                view.open();
                view.focus();
            }, 100);
        },

        sortSkill: function(view) {
            var skill = view.model;
            var expertise = 1;
            var yrs_experience = skill.get_yrs_experience() || 1;
            switch(skill.get_expertise()) {
                case 'Proficient':
                    expertise = 2;
                    break;
                case 'Expert':
                    expertise = 3;
                    break;
            }
            return -1 * (expertise*100 + yrs_experience);
        },

        onInputFocus: function(e) {
            this._closeSkillViews();
            SkillsView.__super__.onInputFocus.call(this, e);
        },

        onChange: function() {
            this.sortChildViews();
        },

        onSkillClose: function(e) {
            //deterime if any of the skill views are open.
            //this will happen if a click on a new skill
            //is closing a previously open skill.
            var isOpen = false;
            _.each(this.childViews, function(view) {
                if(view.isOpen()) {
                    isOpen = true;
                }
            }, this);
            
            //if no skills are open set focus on input
            if(!isOpen) {
                this.focus();
            }
        },

        _closeSkillViews: function() {
            _.each(this.childViews, function(skillView) {
                skillView.close();
            }, this);
        }
    });
    
    /**
     * Skill View
     * @constructor
     * @param {Object} options
     */
    var SkillView = core.view.View.extend({

        events: {
            'click .w-skill-container': 'onContainerClick',
            'click .w-skill-drop': 'onDropClick',
            'click .w-skill-drop .close': 'onDropCloseClick',
            'keydown .w-skill-drop': 'onDropKeyDown',
            'open .drop': 'onOpen',
            'close .drop': 'onClose'
        },

        initialize: function(options) {

            this.model = options.model;
            this.template = _.template(skill_template);

            //bind events
            this.listenTo(this.model, 'change', this.onChange);

            //child views
            this.skillDropView = null;
            this.dropView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.skillDropView = new SkillDropView({
                model: this.model
            });

            this.dropView = new ui.drop.views.DropView({
                view: this.skillDropView,
                targetView: this.$el
            });
        },

        childViews: function() {
            return [this.dropView];
        },

        context: function() {
            return this.model.toJSON({
                withRelated: ['technology']
            });
        },

        classes: function() {
            var result = ['w-skill'];
            var expertise = this.model.get_expertise();
            if(expertise) {
                result.push('w-skill-' + expertise.toLowerCase());
            }
            if(this.dropView.isOpen()) {
                result.push('open');
            }
            return result;
        },

        applyClasses: function() {
            this.$el.attr('class', this.classes().join(' '));
        },

        render: function() {
            var context = this.context();
            this.$el.html(this.template(context));
            this.applyClasses();
            this.append(this.dropView);
            return this;
        },

        focus: function() {
            if(this.isOpen()) {
                this.skillDropView.focus();
            } else {
                this.$el.focus();
            }
        },

        isOpen: function() {
            return this.dropView.isOpen();
        },

        open: function() {
            this.dropView.open();
        },

        close: function() {
            this.dropView.close();
        },

        onContainerClick: function(e) {
            //prevent click in container from setting focus
            //on the autocomplete
            e.stopPropagation();
            this.dropView.toggle();
        },

        onDropClick: function(e) {
            //prevent click in drop from toggling the
            //dropdown or setting focus to autocomplete
            e.stopPropagation();
        },

        onDropCloseClick: function(e) {
            this.dropView.close();
        },

        onDropKeyDown: function(e) {
            switch(e.keyCode) {
                case ui.events.kc.ESC:
                case ui.events.kc.ENTER:
                    this.close();
                    break;
            }
        },

        onOpen: function(e) {
            this.applyClasses();
            this.skillDropView.focus();
        },

        onClose: function(e) {
            this.model.set({
                expertise: this.skillDropView.getExpertise(),
                yrs_experience: this.skillDropView.getYearsExperience()
            });
            this.applyClasses();
        },

        onChange: function() {
            var experience = this.model.get_yrs_experience();
            this.$('.w-skill-experience').text('(' + experience + ')');
            this.applyClasses();
        }
    });

    
    /**
     * Skill Drop View
     * @constructor
     * @param {Object} options
     */
    var SkillDropView = core.view.View.extend({

        events: {
            'change select': 'onSelectChange',
            'click button': 'onButtonClick'

        },

        initialize: function(options) {

            this.model = options.model;
            this.template = _.template(skill_drop_template);
        },

        context: function() {
            return this.model.toJSON({
                withRelated: ['technology']
            });
        },

        classes: function() {
            return ['w-skill-drop'];
        },

        render: function() {
            var context = this.context();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));

            //set tab index so we generate keypress events
            //so drop can be closed by parent view
            this.$el.attr('tabindex', '1');
            return this;
        },

        focus: function() {
            this.$('select').focus();
        },

        getYearsExperience: function() {
            var target = this.$('option:selected');
            return target.val();
        },

        getExpertise: function() {
            var target = this.$('button.active');
            return target.val();
        },

        onSelectChange: function(e) {
            var target = this.$(e.currentTarget);
            var value = target.val();
            this.model.set_yrs_experience(value);
        },

        onButtonClick: function(e) {
            var target = this.$(e.currentTarget);
            this.$('button').removeClass('active');
            target.addClass('active');
            var value = target.val();
            this.model.set_expertise(value);
        }
    });

    /**
     * {@link module:core/factory~Factory|Factory} class for convenience.
     */
    SkillView.Factory = core.factory.buildFactory(SkillView);


    /**
     * Skills Field View
     */
    var SkillsFieldView = ui.form.views.MultiAutoCompleteFieldView.extend({

        /**
         * SkillsFieldView constructor
         * @constructor
         * @augments module:ui/form/views~FieldView
         * @param {object} options Options object
         * @param {Field} options.field Field object
         * @param {FieldState} options.state Field state model
         * @param {Matcher} options.matcher Autocomplete matcher
         * @param {string} [options.placeholder] Placeholder text
         */
        initialize: function(options) {
            SkillsFieldView.__super__.initialize.call(this, options);
        },

        initChildViews: function() {
            this.acView = new SkillsView({
                collection: this.state.rawValue(),
                matcher: this.matcher,
                stringify: this.stringify,
                maxResults: this.maxResults,
                placeholder: this.placeholder,
                viewFactory: this.viewFactory,
                defaultSearch: this.defaultSearch
            });
        }
    });

    /**
     * {@link module:core/factory~Factory|Factory} class for convenience.
     */
    SkillsFieldView.Factory = core.factory.buildFactory(SkillsFieldView);


    return {
        SkillView: SkillView,
        SkillsView: SkillsView,
        SkillsFieldView: SkillsFieldView
    };
});
