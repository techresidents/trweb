define([
    'jquery',
    'underscore',
    'core',
    'api',
    'ui',
    'text!./templates/jobprefs.html'
], function(
    $,
    _,
    core,
    api,
    ui,
    jobprefs_template) {

    var UserJobPrefsView = core.view.View.extend({

        /**
         * User job preferences view.
         * @constructs
         * @param {Object} options
         * @param {User} options.model User model
         */
        initialize: function(options) {
            this.model = options.model;
            this.template =  _.template(jobprefs_template);
            this.modelWithRelated = [
                'position_prefs',
                'technologies',
                'locations'
            ];

            //bind events
            this.loader = new api.loader.ApiLoader([
                { instance: this.model, withRelated: this.modelWithRelated }
            ], {
                triggerAlways: true
            });
            
            this.loader.load({
                success: _.bind(this.render, this)
            });
        },

        events: {
            'click .position-prefs .slide-toggle' : 'togglePositionPrefs',
            'click .location-prefs .slide-toggle' : 'toggleLocationPrefs',
            'click .technology-prefs .slide-toggle' : 'toggleTechnologyPrefs'
        },

        positionPrefsSelector: '.position-prefs',

        locationPrefsSelector: '.location-prefs',

        technologyPrefsSelector: '.technology-prefs',

        expandableItemsSelector: '.expandable-list-items',

        slideToggleSelector: '.slide-toggle',

        render: function() {
            var sortedTechPrefsCollection = this._getSortedJobTechnologyPrefs();
            var context = {
                model: this.model.toJSON({ withRelated: this.modelWithRelated }),
                sortedTechPrefs: sortedTechPrefsCollection.toJSON(),
                fmt: this.fmt // date formatting
            };
            this.$el.html(this.template(context));

            // Add CSS styles to make preference lists expandable
            var expandableSections = [
                this.positionPrefsSelector,
                this.locationPrefsSelector,
                this.technologyPrefsSelector];
            _.each(expandableSections, this.addExpandableStyle, this);

            return this;
        },

        /**
         * Function to make sections of this view expandable.
         * @param selector A CSS selector specifying the elements
         * to make expandable.
         */
        addExpandableStyle: function(selector) {
            // The current view is broken up into discrete logical
            // sections; each with a unique set of list elements <li>.
            this.$(selector).children('li').each(function(i) {
                // Always show the first 3 list items;
                // make the rest of the items expandable.
                var numItemsAlwaysShown = 3;
                if (i > numItemsAlwaysShown-1) { // subtract 1 for 0-index iterator
                    $(this).addClass('expandable-list-items');
                    $(this).hide(); // default to hiding expandable items
                }
            });
        },

        /**
         * Function to handle expanding/contracting the user's position preference.
         */
        togglePositionPrefs: function() {
            this.toggleExpandedView(this.positionPrefsSelector);
        },

        /**
         * Function to handle expanding/contracting the user's location preference.
         */
        toggleLocationPrefs: function() {
            this.toggleExpandedView(this.locationPrefsSelector);
        },

        /**
         * Function to handle expanding/contracting the user's technology preference.
         */
        toggleTechnologyPrefs: function() {
            this.toggleExpandedView(this.technologyPrefsSelector);
        },

        /**
         * Function to expand/contract preference info.
         * @param selector CSS selector used to target
         * which items are expanded/contracted.
         */
        toggleExpandedView: function(selector) {
            // Toggle the expandable items
            var slideSpeed = 200; //millis
            var itemsSelector = selector + ' ' + this.expandableItemsSelector;
            this.$(itemsSelector).slideToggle(slideSpeed);

            // Update text of toggle button
            var sliderSelector = selector + ' ' + this.slideToggleSelector;
            this.toggleExpandButtonText(sliderSelector);
        },

        /**
         * Update the toggle button's text
         * @param selector CSS selector to find the text to update
         */
        toggleExpandButtonText: function(selector) {
            if ($(selector).text() === 'more') {
                $(selector).text('less');
            } else {
                $(selector).text('more');
            }
        },

        /**
         * Convenience function to get a sorted job technology prefs collection.
         * @returns A sorted {Technology} collection.
         * @private
         */
        _getSortedJobTechnologyPrefs: function() {
            var unsortedTechPrefsCollection = this.model.get_technologies();
            var sortedTechPrefsCollection = new Backbone.Collection();
            sortedTechPrefsCollection.comparator = function(technology) {
                // sort by Technology.name
                return technology.get('name');
            };

            // Add technologies to the new sortable collection
            unsortedTechPrefsCollection.each(function(technology) {
                sortedTechPrefsCollection.add(technology);
            }, this);
            return sortedTechPrefsCollection;
        }
    });

    return {
        UserJobPrefsView: UserJobPrefsView
    };
});
