define([
    'jquery',
    'underscore',
    'jquery.bootstrap',
    'core',
    'api',
    'ui',
    'text!./templates/skills.html',
    'text!./templates/skill.html'
], function(
    $,
    _,
    none,
    core,
    api,
    ui,
    skills_template,
    skill_template) {

    var UserSkillView = core.view.View.extend({

        /**
         * User skill view.
         * @constructs
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

        render: function() {
            var context = {
                model: this.model.toJSON({
                    withRelated: ['technology']
                })
            };
            this.$el.html(this.template(context));
            return this;
        }
    });

    var UserSkillsView = core.view.View.extend({

        /**
         * User skills view.
         * @constructs
         * @param {Object} options
         * @param {SkillCollection} options.collection 
         *   Skill collection
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

        events: {
        },

        noviceSkillsSelector: '#novice-skills',

        proficientSkillsSelector: '#proficient-skills',

        expertSkillsSelector: '#expert-skills',

        childViews: function() {
            var result = this.noviceViews.concat(this.proficientViews).concat(this.expertViews);
            return result;
        },

        initChildViews: function() {
            this.destroyChildViews();
            this.noviceViews = [];
            this.proficientViews = [];
            this.expertViews = [];

            this.collection.each(this.createSkillView, this);
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
            var view = new UserSkillView({
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

    return {
        UserSkillsView: UserSkillsView
    };
});
