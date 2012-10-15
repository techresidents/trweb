define([
    'jQuery',
    'Underscore',
    'Backbone'
], function($, _, Backbone) {

    /**
     * Topic model.
     * Chat topics are hierarchical and represented through a parent-child 
     * relationship (adjacency list). The root topic must have a rank
     * and level equal to zero.
     * @constructor
     */
    var Topic = Backbone.Model.extend({

        defaults: function() {
            return {
                parentId: 0,
                level: 1,
                rank: null,
                title: null,
                description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin sit amet rhoncus eros. Proin ut dolor neque, quis pretium massa. In facilisis interdum tortor. Proin fermentum dignissim lorem. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.',
                duration: 5,
                recommendedParticipants: 2,
                expanded: false
            };
        },

        initialize: function() {
            if(this.id === null ||
               this.id === undefined)
            {
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

        recommendedParticipants: function() {
            return this.get('recommendedParticipants');
        },

        setRecommendedParticipants: function(participants) {
            this.set({recommendedParticipants: participants});
            return this;
        }
    });


    /**
     * Topic collection.
     * Contains method for accessing and manipulating topic hierarchy.
     * @constructor
     */
    var TopicCollection = Backbone.Collection.extend({

        model: Topic,
        
        initialize: function() {
            this.selectedIndex = -1;
        },
        
        /**
         * Sort topics by rank.
         */
        comparator: function(topic) {
            return topic.rank();
        },
        
        /**
         * TODO: remove.
         */ 
        select: function(id) {
            this.selectedIndex = this.indexOf(this.get(id));
            this.trigger('change:selection');
            return this;
        },
        
        /**
         * TODO: remove.
         */ 
        selectNext: function() {
            if(this.selectedIndex < this.length - 1) {
                this.selectedIndex++;
            } else {
                this.selectedIndex = -1;
            }
            this.trigger('change:selection');
            return this;
        },
        
        /**
         * TODO: remove.
         */ 
        selected: function() {
            return this.at(this.selectedIndex);
        },


        /**
         * Test if topic is leaf node.
         * @param {number} id Topic id
         * @return {boolean} true if leaf, false otherwise.
         */
        isLeaf: function(id) {
            return this.findChildren(id).length === 0;
        },


        /**
         * Test if topic is allowed be shifted up.
         * @param {number} id Topic id
         * @return {boolean}.
         */
        isShiftUpAllowed: function(id) {
            var topic = this.get(id);
            if(topic.rank() <= 1) {
                return false;
            } else {
                return true;
            }
        },

        /**
         * Test if topic is allowed be shifted down.
         * @param {number} id Topic id
         * @return {boolean}.
         */
        isShiftDownAllowed: function(id) {
            var topic = this.get(id);
            if(topic.rank() === this.length - 1) {
                return false;
            } else {
                return true;
            }
        },

        /**
         * Test if topic is allowed be shifted left.
         * @param {number} id Topic id
         * @return {boolean}.
         */
        isShiftLeftAllowed: function(id) {
            var topic = this.get(id);
            if(topic.level() === 1) {
                return false;
            } else {
                return true;
            }
        },

        /**
         * Test if topic is allowed be shifted right.
         * @param {number} id Topic id
         * @return {boolean}.
         */
        isShiftRightAllowed: function(id) {
            var topic = this.get(id);
            var index = this.indexOf(topic);
            var sibling = this.findPrevLevelSibling(topic.id, topic.level());

            return sibling !== null;
        },

        /**
         * Shift topic up if allowed.
         * Swaps topic with the previous topic.
         * @param {number} id Topic id
         */
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

        /**
         * Shift topic down if allowed.
         * Swaps topic with the next topic.
         * by this topic.
         * @param {number} id Topic id
         */
        shiftDown: function(id) {
            if(!this.isShiftDownAllowed(id)) {
                return;
            }

            var current = this.get(id);
            var index = this.indexOf(current);

            this.shiftUp(this.at(index + 1));
        },

        /**
         * Shift topic right if allowed.
         * @param {number} id Topic id
         */
        shiftRight: function(id) {
            if(!this.isShiftRightAllowed(id)) {
                return;
            }

            var current = this.get(id);
            var index = this.indexOf(current);

            var parentItem = this.findPrevLevelSibling(current.id, current.level());

            current.set({ parentId: parentItem.id, level: current.level() + 1 });

            var children = this.findChildren(id);

            _.each(children, function(topic) {
                topic.set({ level: topic.level() + 1 });
                }, this);
        },

        /**
         * Shift topic rightif allowed.
         * @param {number} id Topic id
         */
        shiftLeft: function(id) {
            if(!this.isShiftLeftAllowed(id)) {
                return;
            }

            var current = this.get(id);
            var index = this.indexOf(current);

            var parentItem = this.findPrevLevelSibling(current.id, current.level() - 2);

            current.set({ parentId: parentItem.id, level: current.level() - 1 });

            var children = this.findChildren(id);

            _.each(children, function(topic) {
                topic.set({ level: topic.level() - 1 });
                }, this);

        },

        /**
         * Find topic children.
         * @param {number} id Topic id
         * @return {Topic[]}
         */
        findChildren: function(id) {
            var topic = this.get(id);

            return this.filter(function(item) {
                return item.parentId() === topic.id;

            }, this);
        },

        /**
         * Find should-be parent of topic.
         * This is useful during manipulation.
         * @param {number} id Topic id
         * @return {Topic}
         */
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

        /**
         * Find the next leaf topic.
         * @param {number} id Topic id
         * @return {Topic} if found, null otherwise.
         */
        findLeaf: function(id) {
            var result = null;

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

        /**
         * Find the previous level sibling at specified level.
         * i.e. Previous topic (rank < topic.rank()) and 
         * topic.level() == level.
         * @param {number} id Topic id
         * @param {number} level 
         */
        findPrevLevelSibling: function(id, level) {
            var topic = this.get(id);

            var siblings = this.filter(function(item) {
                if(item.rank() < topic.rank() && item.level() === level) {
                    return true;
                } else {
                    return false;
                }

            }, this);

            return _.last(siblings);
        },

        /**
         * Remove model.
         */
        remove: function(model, options) {
            var parentItem = this.get(model.parentId());

            var children = this.findChildren(model.id);
            _.each(children, function(item) {
                item.set({ parentId: parentItem.id, level: parentItem.level() + 1 });
            }, this);
            
            Backbone.Collection.prototype.remove.call(this, model, options);
        }

    });

    return {
        Topic: Topic,
        TopicCollection: TopicCollection
    };
});
