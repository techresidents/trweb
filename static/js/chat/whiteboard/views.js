define([
    'jQuery',
    'Underscore',
    'Backbone',
    'whiteboard/views',
    'chat/whiteboard/models',
    'whiteboard/serialize',
], function($, _, Backbone, whiteboardViews, whiteboardModels, serialize) {


    /**
     * Mediator.
     * Responsible for coordinating and composing views together.
     */
    var ChatWhiteboardMediatorView = Backbone.View.extend({

        events: {
            "change #select-whiteboard": "showSelectedWhiteboard"
        },

        initialize: function() {
            this.setElement($("#whiteboard"));
            this.rootWhiteboardNode = null;
            this.whiteboardViews = {};
            this.collection.bind("reset", this.render, this);
            this.collection.bind("add", this.addCollectionListener, this);
            this.collection.bind("remove", this.removeCollectionListener, this);
        },

        render: function() {

            // instantiate whiteboard tools view
            new ChatWhiteboardToolsView().render();

            // instantiate controls view
            new ChatWhiteboardControlsView({
                collection: whiteboardModels.whiteboardCollection
            }).render();

            // instantiate whiteboard container view. This is where the whiteboard will be rendered
            new ChatWhiteboardContainerView().render();
            this.rootWhiteboardNode = this.$('#whiteboard-wrapper');
        },

        /**
         * This method is responsible for creating a new view for
         * each whiteboard when it is created.
         * @param model
         */
        addCollectionListener: function(model) {

            // create new whiteboard view
            var view = new ChatWhiteboardView();
            this.whiteboardViews[model.id] = view;

            // add new whiteboard view to DOM
            view.$el.toggle(false);
            this.rootWhiteboardNode.append(view.render().el);

            // if no whiteboard is being shown, then show the newly created whiteboard
            if (this.$('#whiteboard-wrapper:first-child').is(':hidden')){
                console.log('div is hidden, displaying the newly added whiteboard');
                view.$el.toggle(true);
            }

            // TODO switch to new whiteboard if user added it
            //console.log('myWhiteboard: ' + parseInt(model.myWhiteboard));
            //this.selected = this.$el.find('#select-whiteboard').val();
        },

        /**
         * This method is responsible for deleting the whiteboard's view object.
         * @param model
         */
        removeCollectionListener: function(model) {
            // TODO define what happens when user deletes a whiteboard. Can user only delete the selected whiteboard? What happens after the delete? Which WB is shown?
            delete this.whiteboardViews[model.id];
        },

        /**
         * Responsible for showing/hiding the appropriate whiteboard
         * when the user's WB selection changes.
         */
        showSelectedWhiteboard: function(){

            // determine which whiteboard is selected
            var selectedWhiteboardId = this.$el.find('#select-whiteboard').val();
            console.log('currently selected whiteboard id: ' + selectedWhiteboardId);

            // show the newly selected whitebaord
            if (null != selectedWhiteboardId &&
                selectedWhiteboardId in this.whiteboardViews)
            {
                // hide the previous whiteboard view
                this.rootWhiteboardNode.children().toggle(false);

                // show the newly selected whiteboard view
                var newView = this.whiteboardViews[selectedWhiteboardId];
                console.log('whiteboard view to be drawn: ');
                console.log(newView);
                newView.$el.toggle(true);
            }
        },
    });


    /**
     * Whiteboard view.
     * @constructor
     */
    var ChatWhiteboardView = whiteboardViews.WhiteboardView.extend({

        initialize: function() {

            // call parent
            whiteboardViews.WhiteboardView.prototype.initialize.call(this);

            this.serializer = new serialize.Serializer();

        },

    });


    /**
     * Whiteboard container layout.
     * @constructor
     */
    var ChatWhiteboardContainerView = Backbone.View.extend({

        templateSelector: '#whiteboard-container-template',

        initialize: function() {
            this.setElement($('#whiteboard-containerZ'));
            this.template = _.template($(this.templateSelector).html());
        },

        render: function() {
            this.$el.html(this.template());
            return this;
        },

    });

    /**
     * Whiteboard Tools View.
     * This View is responsible for displaying the list
     * of tools available for the user to use on the
     * whiteboard.
     */
    var ChatWhiteboardToolsView = Backbone.View.extend({

        templateSelector: '#whiteboard-tools-template',

        initialize: function() {
            this.setElement($("#whiteboard-tools"));
            this.template = _.template($(this.templateSelector).html());
        },

        render: function() {
            this.$el.html(this.template());
            return this;
        },
    });

    /**
     * Whiteboard container view.
     * This view will be responsible for displaying all of the
     * tools and other whiteboard action buttons. This view
     * will remain visible regardless of which specific whiteboard
     * is being viewed.
     */
    var ChatWhiteboardControlsView = Backbone.View.extend({

        templateSelector: '#whiteboard-controls-template',
        events: {
            "click #whiteboard-add-button": "addWhiteboardButtonHandler",
            "click #whiteboard-delete-button": "deleteWhiteboardButtonHandler"
        },

        initialize: function() {
            this.setElement($("#whiteboard-controls"));
            this.template = _.template($(this.templateSelector).html());

            // Create a whiteboard if one doesn't already exist.
            // Note that this block of code could be invoked even
            // if the collection is not empty due to the delay in
            // receiving the chat data from the long poll.  For this
            // reason, the WhiteboardCollection will not add models
            // to the collection that have a duplicate name; thus, in
            // this case, a duplicate default whiteboard will not be added.
            if (this.collection.length < 1){
                console.log('Creating a default whiteboard');
                var whiteboard = new whiteboardModels.Whiteboard({
                    name: 'Default Whiteboard',
                });
                whiteboard.save();
            }

            // TODO not sure if I need last part or not. Is it worthwhile if user doesn't have the data yet?
            this.selected = null;
            this.jsonWhiteboardList = {'whiteboardCollection': this.collection.toJSON()};
            //this.collection.each(this.added, this);

            this.collection.bind("reset", this.render, this);
            this.collection.bind("add", this.addCollectionListener, this);
            this.collection.bind("remove", this.removeCollectionListener, this);
        },

        /**
         * Render element to screen
         */
        render: function() {
            this.$el.html(this.template(this.jsonWhiteboardList));
            return this;
        },

        /**
         * This method is responsible for updating the list of whiteboards.
         * @param model
         */
        addCollectionListener: function(model) {
            this.jsonWhiteboardList = {'whiteboardCollection': this.collection.toJSON()};
            this.render();
        },

        /**
         * This method is responsible for updating the list of whiteboards
         * @param model
         */
        removeCollectionListener: function(model) {
            this.jsonWhiteboardList = {'whiteboardCollection': this.collection.toJSON()};
            this.render();
        },

        /**
         * This function listens to the create-whiteboard modal dialog's
         * success button.
         */
        addWhiteboardButtonHandler: function() {

            // read input whiteboard name
            var wbNameInput = this.$('#whiteboard-name-input');
            var wbName = wbNameInput.val();

            // validate the input whiteboard name
            if (wbName == '' || wbName.length == 0){
                wbName = 'Whiteboard #' + parseInt(this.collection.length+1);
            }

            // clear name field
            wbNameInput.val('');

            // max number of whiteboards is 10
            if (this.collection.length <= 10){
                console.log('Creating whiteboard: ' + wbName);
                var whiteboard = new whiteboardModels.Whiteboard({
                    name: wbName
                });
                whiteboard.save();
            }

            // hide modal dialog when done
            this.$el.find('#create-whiteboard-modal').modal('hide');
        },

        /**
         * This function listens to the 'delete-whiteboard' button.
         */
        deleteWhiteboardButtonHandler: function() {
            // minimum number of whiteboards is 1
            if (this.collection.length > 1) {
                var currentlySelectedWhiteboardId = this.$el.find('#select-whiteboard').val();
                var wb = this.collection.get(currentlySelectedWhiteboardId);
                // don't allow users to delete the default whiteboard
                if (wb.name() != 'Default Whiteboard'){
                    console.log('Deleting whiteboard: ' + wb.name());
                    wb.destroy();
                }
            }
        }
    });

    /**
     * Whiteboard tab view.
     * @constructor
     */
    var ChatWhiteboardTabView = Backbone.View.extend({

        initialize: function() {
        },

        render: function() {
            new ChatWhiteboardMediatorView({
                collection: whiteboardModels.whiteboardCollection
            }).render();
        }
    });

    return {
        ChatWhiteboardTabView: ChatWhiteboardTabView
    }
});
