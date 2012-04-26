define([
    'jQuery',
    'Underscore',
    'Backbone',
], function($, _, Backbone) {

    var Topic = Backbone.Model.extend({

        defaults: function() {
            return {
                parentId: 0,
                level: 1,
                rank: null,
                title: null,
                description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin sit amet rhoncus eros. Proin ut dolor neque, quis pretium massa. In facilisis interdum tortor. Proin fermentum dignissim lorem. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.',
                duration: 5,
                expanded: false
            };
        },

        initialize: function() {
            if(this.get('id') == null) {
                this.set({ id: this.cid });
            }
        },

        parentId: function() {
            return this.get('parentId');
        },

        setParentId: function(parentId) {
            this.set({parentId: parentId});
            return this;
        },

        level: function() {
            return this.get('level');
        },

        setLevel: function(level) {
            this.set({level: level});
            return this;
        },

        rank: function() {
            return this.get('rank');
        },

        setRank: function(rank) {
            this.set({rank: rank});
        },

        title: function() {
            return this.get('title');
        },

        setTitle: function(title) {
            this.set({title: title});
            return this;
        },

        description: function() {
            return this.get('description');
        },

        setDescription: function(description) {
            this.set({description: description});
            return this;
        },

        duration: function() {
            return this.get('duration');
        },

        setDuration: function(duration) {
            this.set({duration: duration});
            return this;
        },

        durationMs: function() {
            return this.duration() * 60 * 1000;
        },

        setDurationMs: function(durationMs) {
            this.set({duration: durationMs / 60 / 1000});
            return this;
        },
    });


    var TopicCollection = Backbone.Collection.extend({

        model: Topic,

        selectedIndex: -1,

        comparator: function(topic) {
            return topic.rank();
        },
        
        select: function(id) {
            this.selectedIndex = this.indexOf(this.get(id));
            this.trigger('change:selection');
            return this;
        },
        
        selectNext: function() {
            if(this.selectedIndex < this.length - 1) {
                this.selectedIndex++;
            } else {
                this.selectedIndex = -1;
            }
            this.trigger('change:selection');
            return this;
        },
        
        selected: function() {
            return this.at(this.selectedIndex);
        },

        isLeaf: function(id) {
            return this.findChildren(id).length == 0;
        },

        isShiftUpAllowed: function(id) {
            var topic = this.get(id);
            if(topic.rank() <= 1) {
                return false;
            } else {
                return true;
            }
        },

        isShiftDownAllowed: function(id) {
            var topic = this.get(id);
            if(topic.rank() == this.length - 1) {
                return false;
            } else {
                return true;
            }
        },

        isShiftLeftAllowed: function(id) {
            var topic = this.get(id);
            if(topic.level() == 1) {
                return false;
            } else {
                return true;
            }
        },

        isShiftRightAllowed: function(id) {
            var topic = this.get(id);
            var index = this.indexOf(topic);
            var sibling = this.findPrevLevelSibling(topic.id, topic.level());

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
                topic.set({ parentId: prev.id, level: prev.level() + 1 }, { silent: true });
                }, this);
            
            
            prev.set( {rank: prev.rank() + 1 }, { silent: true });
            current.set( {rank: current.rank() - 1, level: prev.level() }, { silent: true });
            
            var parentItem = this.findParent(id);
            current.set({ parentId: parentItem.id, level: parentItem.level() + 1 }, { silent: true });   

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

            var parentItem = this.findPrevLevelSibling(current.id, current.level());

            current.set({ parentId: parentItem.id, level: current.level() + 1 });
        },

        shiftLeft: function(id) {
            if(!this.isShiftLeftAllowed(id)) {
                return;
            }

            var current = this.get(id);
            var index = this.indexOf(current);
            var parentItem = this.findPrevLevelSibling(current.id, current.level() - 1);

            current.set({ parentId: parentItem.id, level: current.level() - 1 });


            var children = this.findChildren(id);

            _.each(children, function(topic) {
                topic.set({ level: topic.level() -1 });
                }, this);

        },

        findChildren: function(id) {
            var topic = this.get(id);

            return this.filter(function(item) {
                return item.parentId() == topic.id;

            }, this);
        },

        findParent: function(id) {
            var topic = this.get(id);

            var items = this.filter(function(item) {
                if(item.rank() < topic.rank() && item.level() < topic.level()) {
                    return true;
                } else {
                    return false;
                }

            }, this);
            
            return _.last(items);
        },

        findLeaf: function(id) {
            var topic = this.get(id);
            var index = this.indexOf(topic);
            var i = index + 1;

            for(i; i < this.length; i++) {
                var t = this.at(i);
                if(this.isLeaf(t.id)) {
                    result = t;
                    break;
                }
            }

            return result;
        },

        findPrevLevelSibling: function(id, level) {
            var topic = this.get(id);

            var siblings = this.filter(function(item) {
                if(item.rank() < topic.rank() && item.level() == level) {
                    return true;
                } else {
                    return false;
                }

            }, this);

            return _.last(siblings);
        },

        remove: function(model, options) {
            var parentItem = this.get(model.parentId());

            var children = this.findChildren(model.id);
            _.each(children, function(item) {
                item.set({ parentId: parentItem.id, level: parentItem.level() + 1 });
            }, this);
            
            this._remove(model, options);
        }

    });

    return {
        Topic: Topic,
        TopicCollection: TopicCollection
    }
});
