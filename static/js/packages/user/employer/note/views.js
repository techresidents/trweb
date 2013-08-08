define([
    'jquery',
    'underscore',
    'core',
    'api',
    'ui',
    'events',
    'text!./templates/note.html'
], function(
    $,
    _,
    core,
    api,
    ui,
    events,
    note_template) {

    var UserNoteView = core.view.View.extend({

        /**
         * User note view.
         * @constructs
         * @param {Object} options
         * @param {User} candidateModel Candidate user model
         */
        initialize: function(options) {
            this.candidateModel = options.candidateModel;
            this.employeeModel = new api.models.User({id: 'CURRENT'});
            this.model = null;
            this.saveTimeout = null;
            this.saveStatus = null;
            // We enable this view for editing once we know the
            // existing note model has loaded, if it exists. This prevents
            // us from creating a new note and overwriting an existing note.
            this.template = _.template(note_template);

            this.notesCollection = new api.models.JobNoteCollection();
            this.notesCollection.on('reset', this.onReset, this);

            // Since we retrieved all notes on the candidate, we need to
            // filter the collection down to just the employee's notes
            this.noteQuery = this.notesCollection.filterBy({
                candidate_id: this.candidateModel.id,
                employee_id: this.employeeModel.id,
                tenant_id: this.employeeModel.get_tenant_id()
            });
            this.noteQuery.fetch();
        },

        events: {
            'blur textarea': 'onBlur'
        },

        textareaSelector: '.user-note-input',

        saveStatusSelector: '.user-note-save-status',

        SaveStatusEnum: {
            PENDING : 'Saving note...',
            SAVED : 'Saved.',
            ERROR : 'Error saving note.'
        },

        destroy: function() {
            if (this.saveStatus === this.SaveStatusEnum.PENDING) {
                this._save();
            }
            core.view.View.prototype.destroy.apply(this, arguments);
        },

        render: function() {
            var context = {
                model: this.model ? this.model.toJSON() : null
            };
            this.$el.html(this.template(context));
            return this;
        },

        onReset: function() {
            // Load Note if it exists or create new Note
            if (this.notesCollection.length) {
                this.model = this.notesCollection.first();
                this.saveStatus = this.SaveStatusEnum.SAVED;
            } else {
                this.model = new api.models.JobNote({
                    employee_id: this.employeeModel.id,
                    candidate_id: this.candidateModel.id,
                    tenant_id: this.employeeModel.get_tenant_id()
                });
            }
            // Display the note
            this.render();
        },

        onBlur: function() {
            var currentNote = this.$(this.textareaSelector).val();
            var isNoteModified = true;

            // Don't save if the user hasn't previously saved a note and
            // the textarea is empty. This will prevent saving empty notes.
            if (this.saveStatus === null &&
                currentNote.length === 0) {
                isNoteModified = false;
            }

            // Don't save if current text is identical to previously saved text
            // Checking for a SAVED status here also ensures that this.model
            // will not be null when get_note() is invoked.
            if (this.saveStatus === this.SaveStatusEnum.SAVED &&
                this.model.get_note() === currentNote) {
                isNoteModified = false;
            }

            if (isNoteModified) {
                this._scheduleSave();
            }
        },

        /**
         * Update the save status in the UI
         */
        updateSaveStatusUI: function() {
            this.$(this.saveStatusSelector).text(this.saveStatus);
        },

        /**
         * Method to schedule saving the note in the future.
         * This method is required to prevent the user from
         * saving their note every second (or more), and triggering
         * a large number of writes on the db.
         * @private
         * @param secs Number of millisecs to delay until saving (optional)
         *        Default value is 500 milliseconds.
         */
        _scheduleSave: function(millisecs) {
            var delay = millisecs || 500; // 500 millisec default
            this.saveStatus = this.SaveStatusEnum.PENDING;
            this.updateSaveStatusUI();
            // clear any existing scheduled saves
            clearTimeout(this.saveTimeout);
            // Wrap the save function callback using JQuery's proxy() since
            // setTimeout doesn't support passing a context.
            this.saveTimeout = setTimeout($.proxy(this._save, this), delay);
        },

        /**
         * Save note.
         * @private
         */
        _save: function() {
            var that = this;
            var attributes = {
                candidate_id: this.model.get_candidate_id(),
                note: this.$(this.textareaSelector).val()
            };
            var eventBody = _.extend({
                model: this.model,
                onSuccess: function() {
                    that.saveStatus = that.SaveStatusEnum.SAVED;
                    that.updateSaveStatusUI();
                }
            }, attributes);
            this.triggerEvent(events.TAKE_NOTE, eventBody);
        }
    });

    return {
        UserNoteView: UserNoteView
    };
});
