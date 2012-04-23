define([
    'jQuery',
    'Underscore',
    'Backbone',
    'topic/models',
], function($, _, Backbone, topic) {
    
    var Agenda = Backbone.Model.extend({
            
            localStorage: new Backbone.LocalStorage("Agenda"),
            
            defaults: function() {
                return {
                    selected: null,
                    selectedIndex: -1,
                    active: null,
                    activeIndex: -1,
                    topics: new topic.TopicCollection
                };
            },
            
            initialize: function(attributes, options) {
            },

            topics: function() {
                return this.get("topics");
            },
            
            selectedIndex: function() {
                return this.get("selectedIndex");
            },

            selected: function() {
                return this.get("selected");
            },

            select: function(topic) {
                if(topic !== this.selected()) {
                    if(topic) {
                        this.set({
                            selectedIndex: topic.get("rank"),
                            selected: topic
                        });
                    } else {
                        this.set({
                            selectedIndex: -1,
                            selected: null
                        });
                    }
                }
            },

            selectNext: function() {
                if(this.selectedIndex() < this.topics().length - 1) {
                    var index = this.selectedIndex() + 1;
                    this.select(this.topics().at(index));
                } else {
                    this.select(null);
                }
            },

            activeIndex: function() {
                return this.get("activeIndex");
            },

            active: function() {
                return this.get("active");
            },

            activate: function(topic) {
                if(topic !== this.active()) {
                    if(topic) {
                        this.set({
                            activeIndex: topic.get("rank"),
                            active: topic
                        });
                    } else {
                        this.set({
                            activeIndex: -1,
                            active: null
                        });
                    }
                }
            },

            activateNext: function() {
                if(this.activeIndex() < this.topics().length - 1) {
                    var index = this.activeIndex() + 1;
                    this.activate(this.topics().at(index));
                } else {
                    this.activate(null);
                }
            },

    });

    return {
        agenda: new Agenda
    };
});
