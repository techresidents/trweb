define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'ui',
    'text!./templates/skill.html',
    'text!./templates/skills.html',
    'text!./templates/edit_skill.html',
    'text!./templates/edit_skill_drop.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    ui,
    skill_template,
    skills_template,
    edit_skill_template,
    edit_skill_drop_template) {

    var SkillView = core.view.View.extend({

        /**
         * Skill view.
         * @constructor
         * @param {Object} options
         * @param {Skill} options.model Skill model
         */
        initialize: function(options) {
            this.template = _.template(skill_template);
            this.modelWithRelated = ['technology'];
            
            //bind events
            this.listenTo(this.model, 'change', this.render);

            this.loader = new api.loader.ApiLoader([
                { instance: this.model, withRelated: this.modelWithRelated }
            ]);

            this.loader.load();
        },

        classes: function() {
            var result = ['w-skill'];
            if(this.model.isLoaded()) {
                result.push('w-skill-' + this.model.get_expertise().toLowerCase());
            }
            return result;

        },

        render: function() {
            var context = {
                model: this.model.toJSON({
                    withRelated: ['technology']
                })
            };
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        }
    });

    var SkillsView = core.view.View.extend({

        events: {
        },

        /**
         * Skills view.
         * @constructor
         * @param {Object} options
         * @param {SkillCollection} options.collection Skill collection
         */
        initialize: function(options) {
            this.template =  _.template(skills_template);
            this.collectionWithRelated = ['technology'];
            
            //bind events
            this.listenTo(this.collection, 'reset', this.onReset);
            this.listenTo(this.collection, 'add', this.onAdd);

            this.loader = new api.loader.ApiLoader([
                { instance: this.collection, withRelated: this.collectionWithRelated }
            ]);

            this.loader.load();

            //child views
            this.noviceViews = [];
            this.proficientViews = [];
            this.expertViews = [];
            this.initChildViews();
        },

        noviceSkillsSelector: '.w-skills-novice',

        proficientSkillsSelector: '.w-skills-proficient',

        expertSkillsSelector: '.w-skills-expert',

        childViews: function() {
            var result = this.noviceViews
                .concat(this.proficientViews)
                .concat(this.expertViews);
            return result;
        },

        initChildViews: function() {
            this.destroyChildViews();
            this.noviceViews = [];
            this.proficientViews = [];
            this.expertViews = [];

            this.collection.each(this.createSkillView, this);
        },

        classes: function() {
            return ['w-skills'];
        },

        render: function() {
            // Count the number of items in each expertise group
            var expertiseCounts = _.countBy(this.collection.models, function(skill) {
                return skill.get_expertise();
            });

            var context = {
                collection: this.collection.toJSON(),
                expertCount: expertiseCounts.Expert,
                proficientCount: expertiseCounts.Proficient,
                noviceCount: expertiseCounts.Novice
            };
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));

            _.each(this.noviceViews, function(view) {
                this.append(view, this.noviceSkillsSelector);
            }, this);

            _.each(this.proficientViews, function(view) {
                this.append(view, this.proficientSkillsSelector);
            }, this);

            _.each(this.expertViews, function(view) {
                this.append(view, this.expertSkillsSelector);
            }, this);

            // Activate tooltips
            this.$('[rel=tooltip]').tooltip();

            return this;
        },

        destroy: function() {
            // Need to hide any tooltips since this view could be removed
            // from the DOM before a mouseleave() event fires
            this.$('[rel=tooltip]').tooltip('hide');
            core.view.View.prototype.destroy.apply(this, arguments);
        },

        createSkillView: function(model) {
            var view = new SkillView({
                model: model
            });

            var compare = function(view1, view2) {
                return core.array.defaultCompare(
                        -view1.model.get_yrs_experience(),
                        -view2.model.get_yrs_experience());
            };

            switch(model.get_expertise()) {
                case 'Novice':
                    core.array.binaryInsert(this.noviceViews, view, compare);
                    break;
                case 'Proficient':
                    core.array.binaryInsert(this.proficientViews, view, compare);
                    break;
                case 'Expert':
                    core.array.binaryInsert(this.expertViews, view, compare);
                    break;
            }

            return view;
        },

        onReset: function() {
            this.initChildViews();
            this.render();
        },

        onAdd: function(model) {
            var view = this.createSkillView(model);
            this.render();
        }
    });
    
    var EditSkillsView = ui.ac.views.MultiAutoCompleteView.extend({

        events: function() {
            return _.extend({
                'close .w-edit-skill': 'onSkillClose'
            }, EditSkillsView.__super__.events);
        },

        /**
         * Edit Skills View
         * @constructor
         * @param {Object} options
         */
        initialize: function(options) {
            options.viewFactory = new EditSkillView.Factory();

            this.listenTo(this.collection, 'change', this.onChange);

            EditSkillsView.__super__.initialize.call(this, options);
        },

        initChildViews: function() {
            //disabling sorting for now since  previously we were only
            //sorting the persisted skills and not newly added skills.
            //As a result, when backspace is pressed for newly added
            //skills we need to pop of the last skill in the collection,
            //and for persisted skills we need to sort and figure out
            //which to remove. Too much work... removing sorting for now.
            //TODO maybe backend can sort this.
            
            //this.sort = _.bind(this.sortSkill, this);
            EditSkillsView.__super__.initChildViews.call(this);
            //this.sort = null;
        },

        addMatch: function(match) {
            var model = EditSkillsView.__super__.addMatch.call(this, match);
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
            EditSkillsView.__super__.onInputFocus.call(this, e);
        },

        onChange: function() {
            //this.sortChildViews();
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
    
    var EditSkillView = core.view.View.extend({

        events: {
            'click .w-edit-skill-container': 'onContainerClick',
            'click .w-edit-skill-drop': 'onDropClick',
            'click .w-edit-skill-drop .close': 'onDropCloseClick',
            'keydown .w-edit-skill-drop': 'onDropKeyDown',
            'open .drop': 'onOpen',
            'close .drop': 'onClose'
        },

        /**
         * Edit Skill View
         * @constructor
         * @param {Object} options
         */
        initialize: function(options) {

            this.model = options.model;
            this.template = _.template(edit_skill_template);

            //bind events
            this.listenTo(this.model, 'change', this.onChange);

            //child views
            this.skillDropView = null;
            this.dropView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.skillDropView = new EditSkillDropView({
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
            var result = ['w-edit-skill'];
            var expertise = this.model.get_expertise();
            if(expertise) {
                result.push('w-edit-skill-' + expertise.toLowerCase());
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
                    e.preventDefault();
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
            this.$('.w-edit-skill-experience').text('(' + experience + ')');
            this.applyClasses();
        }
    });

    
    var EditSkillDropView = core.view.View.extend({

        events: {
            'change select': 'onSelectChange',
            'click button': 'onButtonClick'

        },

        /**
         * Edit Skill Drop View
         * @constructor
         * @param {Object} options
         */
        initialize: function(options) {

            this.model = options.model;
            this.template = _.template(edit_skill_drop_template);
        },

        context: function() {
            return this.model.toJSON({
                withRelated: ['technology']
            });
        },

        classes: function() {
            return ['w-edit-skill-drop'];
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
    EditSkillView.Factory = core.factory.buildFactory(EditSkillView);


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
            this.acView = new EditSkillsView({
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
        EditSkillView: EditSkillView,
        EditSkillsView: EditSkillsView,
        SkillsFieldView: SkillsFieldView
    };
});
