define([
    'jQuery',
    'Underscore',
    'Backbone',
], function($, _, Backbone) {

    var Topic = Backbone.Model.extend({

            defaults: function() {
                return {
                    id: null,
                    parentId: 0,
                    level: 1,
                    rank: null,
                    title: "",
                    description: "This is a description",
                    expanded: false
                };
            },

            initialize: function() {
                if(this.get("id") == null) {
                    this.set({ id: this.cid });
                }
            }
    });


    var TopicCollection = Backbone.Collection.extend({
            model: Topic,

            selectedIndex: -1,

            comparator: function(topic) {
                return topic.get("rank");
            },
    
            select: function(id) {
                this.selectedIndex = this.indexOf(this.get(id));
                this.trigger("change:selection");
                return this;
            },
    
            selectNext: function() {
                if(this.selectedIndex < this.length - 1) {
                    this.selectedIndex++;
                } else {
                    this.selectedIndex = -1;
                }
                this.trigger("change:selection");
                return this;
            },
    
            selected: function() {
                return this.at(this.selectedIndex);
            },

            isShiftUpAllowed: function(id) {
                var topic = this.get(id);
                if(topic.get("rank") <= 1) {
                    return false;
                } else {
                    return true;
                }
            },

            isShiftDownAllowed: function(id) {
                var topic = this.get(id);
                if(topic.get("rank") == this.length - 1) {
                    return false;
                } else {
                    return true;
                }
            },

            isShiftLeftAllowed: function(id) {
                var topic = this.get(id);
                if(topic.get("level") == 1) {
                    return false;
                } else {
                    return true;
                }
            },

            isShiftRightAllowed: function(id) {
                var topic = this.get(id);
                var index = this.indexOf(topic);
                var sibling = this.findPrevLevelSibling(topic.id, topic.get("level"));

                return sibling != null;
            },

            shiftUp: function(id) {
                if(!this.isShiftUpAllowed(id)) {
                    return;
                }

                var current = this.get(id);
                var index = this.indexOf(current);

                var prev = this.at(index - 1);
                var children = this.findChildren(id);

                _.each(children, function(topic) {
                    topic.set({ parentId: prev.id, level: prev.get("level") + 1 }, { silent: true });
                    }, this);
                
                
                prev.set( {rank: prev.get("rank") + 1 }, { silent: true });
                current.set( {rank: current.get("rank") - 1, level: prev.get("level") }, { silent: true });
                
                var parentItem = this.findParent(id);
                current.set({ parentId: parentItem.id, level: parentItem.get("level") + 1 }, { silent: true });   

                this.sort();
            },

            shiftDown: function(id) {
                if(!this.isShiftDownAllowed(id)) {
                    return;
                }

                var current = this.get(id);
                var index = this.indexOf(current);

                return this.shiftUp(this.at(index + 1));
            },

            shiftRight: function(id) {
                if(!this.isShiftRightAllowed(id)) {
                    return;
                }

                var current = this.get(id);
                var index = this.indexOf(current);

                var parentItem = this.findPrevLevelSibling(current.id, current.get("level"));

                current.set({ parentId: parentItem.id, level: current.get("level") + 1 });
            },

            shiftLeft: function(id) {
                if(!this.isShiftLeftAllowed(id)) {
                    return;
                }

                var current = this.get(id);
                var index = this.indexOf(current);
                var parentItem = this.findPrevLevelSibling(current.id, current.get("level") - 1);

                current.set({ parentId: parentItem.id, level: current.get("level") - 1 });


                var children = this.findChildren(id);

                _.each(children, function(topic) {
                    topic.set({ level: topic.get("level") -1 });
                    }, this);

            },

            findChildren: function(id) {
                var topic = this.get(id);

                return this.filter(function(item) {
                    return item.get("parentId") == topic.id;

                }, this);
            },

            findParent: function(id) {
                var topic = this.get(id);

                var items = this.filter(function(item) {
                    if(item.get("rank") < topic.get("rank") && item.get("level") < topic.get("level")) {
                        return true;
                    } else {
                        return false;
                    }

                }, this);
                
                return _.last(items);
            },

            findPrevLevelSibling: function(id, level) {
                var topic = this.get(id);

                var siblings = this.filter(function(item) {
                    if(item.get("rank") < topic.get("rank") && item.get("level") == level) {
                        return true;
                    } else {
                        return false;
                    }

                }, this);

                return _.last(siblings);
            },

            remove: function(model, options) {
                var parentItem = this.get(model.get("parentId"));

                var children = this.findChildren(model.id);
                _.each(children, function(item) {
                    item.set({ parentId: parentItem.id, level: parentItem.get("level") + 1 });
                }, this);
                
                this._remove(model, options);
            }

    });

    return {
        Topic: Topic,
        TopicCollection: TopicCollection
    }
});
