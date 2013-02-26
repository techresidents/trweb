define([
    'jquery',
    'underscore',
    'core/view',
    'choices/models',
    'text!choices/templates/choices.html'
], function(
    $,
    _,
    view,
    choices_models,
    choices_template) {

    var EVENTS = {
        CHOICE_SELECTED: 'CHOICE_SELECTED_EVENT',
        CHOICE_UNSELECTED: 'CHOICE_UNSELECTED_EVENT'
    };

    /**
     * Choices View.
     * @constructor
     * @param {Object} options
     *   collection: {Collection} collection (required)
     *   map: {Function} map function (optional)
     *     if collection is not a {ChoiceCollection}
     *     a map function must be supplied to convert
     *     a collection model to a {Choice} model.
     */
    var ChoicesView = view.View.extend({

        defaultTemplate: choices_template,

        events: {
            'click input': 'onClick'
        },
        
        initialize: function(options) {
            this.template = _.template(this.defaultTemplate);
            this.collection = options.collection;
            this.map = options.map;

            this.listenTo(this.collection, 'reset add remove', this.render);
        },

        context: function() {
            var result;
            var choiceCollection;
            if(this.map) {
                choiceCollection = new choices_models.ChoiceCollection(
                    this.collection.map(this.map)
                );
            } else {
                choicesCollection = this.collection;
            }

            result = {
                choices: choicesCollection.toJSON()
            };

            return result;
        },

        classes: function() {
            return ['choices'];
        },

        render: function() {
            var context = this.context();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        },

        onClick: function(e) {
            var checked = e.target.checked;
            var id = $(e.target).data('id');
            var model = this.collection.get(id);

            if(model instanceof choices_models.Choice) {
                model.set({
                    selected: checked
                });
            }

            if(checked) {
                this.triggerEvent(EVENTS.CHOICE_SELECTED, {
                    model: model
                });
            } else {
                this.triggerEvent(EVENTS.CHOICE_UNSELECTED, {
                    model: model
                });
            }
        }
    });

    return {
        EVENTS: EVENTS,
        ChoicesView: ChoicesView
    };

});
