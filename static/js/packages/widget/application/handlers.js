define([
    'jquery',
    'underscore',
    'core',
    'events'
], function(
    $,
    _,
    core,
    events) {
    
    var ApplicationHandler = core.base.Base.extend({

        initialize: function(options) {
            this.model = options.model;
            this.view = options.view;
            this.excludedActions = options.excludedActions || [];
        },

        updateApplicationStatus: function(status) {
            if(this.isValidStatusChange(status)) {
                this.view.triggerEvent(events.UPDATE_APPLICATION_STATUS, {
                    model: this.model,
                    status: status
                });
            }
        },
        
        createApplicationLog: function(note) {
            this.view.triggerEvent(events.CREATE_APPLICATION_LOG, {
                application: this.model,
                note: note
            });
        },

        viewApplication: function() {
            this.view.triggerEvent(events.VIEW_NAVIGATE, {
                type: 'ApplicationView',
                id: this.model.id
            });
        },

        makeInterviewOffer: function() {
            //avoid circular dependency on '../offer/views'
            require(['widget'], _.bind(function(widget) {
                var modal = new widget.offer.views.MakeInterviewOfferModal({
                    model: this.model.get_user(),
                    application: this.model
                });
                this.view.append(modal);
            }, this));
        },

        rescindInterviewOffer: function() {
            //avoid circular dependency on '../offer/views'
            require(['widget'], _.bind(function(widget) {
                var modal = new widget.offer.views.RescindInterviewOfferModal({
                    model: this.model
                });
                this.view.append(modal);
            }, this));
        },

        menuItems: function() {
            var showOfferDivider = this.isValidStatusChange('REVIEW') &&
                (this.isVisibleAction(ApplicationHandler.MAKE_INTERVIEW_OFFER) ||
                 this.isVisibleAction(ApplicationHandler.RESCIND_INTERVIEW_OFFER));

            return [
                { key: 'view-application', label: 'View Application',
                  handler: _.bind(this.viewApplication, this),
                  visible: this.isVisibleAction(ApplicationHandler.VIEW_APPLICATION)
                },
                { key: 'divider',
                  visible: this.isVisibleAction(ApplicationHandler.VIEW_APPLICATION)},
                { key: 'review', label: 'Review',
                  handler: _.bind(this.updateApplicationStatus, this, 'REVIEW'),
                  visible: this.isVisibleStatusChange('REVIEW')
                },
                { key: 'divider', visible: showOfferDivider},
                { key: 'make-interview_offer', label: 'Make Interview Offer',
                  handler: _.bind(this.makeInterviewOffer, this),
                  visible: this.isVisibleAction(ApplicationHandler.MAKE_INTERVIEW_OFFER)
                },
                { key: 'rescind-interview_offer', label: 'Rescind Interview Offer',
                  handler: _.bind(this.rescindInterviewOffer, this),
                  visible: this.isVisibleAction(ApplicationHandler.RESCIND_INTERVIEW_OFFER)
                },
                { key: 'divider',
                  visible: this.isVisibleStatusChange('REJECTED')
                },
                { key: 'reject', label: 'Reject',
                  handler: _.bind(this.updateApplicationStatus, this, 'REJECTED'),
                  visible: this.isVisibleStatusChange('REJECTED')
                }
            ];
        },

        isVisibleAction: function(action) {
            var result = false;
            if(!_.contains(this.excludedActions, action)) {
                result = this.isValidAction(action);
            }
            return result;
        },

        isValidAction: function(action) {
            return _.contains(this.validActions(), action);
        },

        validActions: function() {
            var result = [];

            switch(this.model.get_status()) {
                case 'NEW':
                case 'REVIEW':
                    result = [
                        ApplicationHandler.UPDATE_APPLICATION_STATUS,
                        ApplicationHandler.MAKE_INTERVIEW_OFFER];
                    break;
                case 'INTERVIEW_OFFER_PENDING':
                    result = [ApplicationHandler.RESCIND_INTERVIEW_OFFER];
                    break;
                case 'INTERVIEW_OFFER_ACCEPTED':
                    result = [ApplicationHandler.UPDATE_APPLICATION_STATUS];
                    break;
                case 'INTERVIEW_OFFER_DECLINED':
                    result = [ApplicationHandler.UPDATE_APPLICATION_STATUS];
                    break;
                case 'INTERVIEW_OFFER_RESCINDED':
                    result = [
                        ApplicationHandler.UPDATE_APPLICATION_STATUS,
                        ApplicationHandler.MAKE_INTERVIEW_OFFER];
                    break;
                case 'INTERVIEW_OFFER_EXPIRED':
                    result = [ApplicationHandler.UPDATE_APPLICATION_STATUS];
                    break;
                case 'JOB_OFFER_PENDING':
                    break;
                case 'JOB_OFFER_ACCEPTED':
                    break;
                case 'JOB_OFFER_DECLINED':
                    break;
                case 'JOB_OFFER_RESCINDED':
                    break;
                case 'JOB_OFFER_EXPIRED':
                    break;
                case 'REJECTED':
                    result = [ApplicationHandler.UPDATE_APPLICATION_STATUS];
                    break;
            }

            result.push(ApplicationHandler.VIEW_APPLICATION);

            return result;
        },

        isVisibleStatusChange: function(status) {
            var visible = this.isVisibleAction(
                    ApplicationHandler.UPDATE_APPLICATION_STATUS);
            return visible && this.isValidStatusChange(status);
        },

        isValidStatusChange: function(status) {
            return _.contains(this.validStatusChanges(), status);
        },

        validStatusChanges: function() {
            var result = [];
            switch(this.model.get_status()) {
                case 'NEW':
                    result = ['REVIEW', 'REJECTED'];
                    break;
                case 'REVIEW':
                    result = ['NEW', 'REJECTED'];
                    break;
                case 'INTERVIEW_OFFER_PENDING':
                    break;
                case 'INTERVIEW_OFFER_ACCEPTED':
                    result = ['NEW', 'REVIEW', 'REJECTED'];
                    break;
                case 'INTERVIEW_OFFER_DECLINED':
                    result = ['NEW', 'REVIEW', 'REJECTED'];
                    break;
                case 'INTERVIEW_OFFER_RESCINDED':
                    result = ['NEW', 'REVIEW', 'REJECTED'];
                    break;
                case 'INTERVIEW_OFFER_EXPIRED':
                    result = ['NEW', 'REVIEW', 'REJECTED'];
                    break;
                case 'JOB_OFFER_PENDING':
                    break;
                case 'JOB_OFFER_ACCEPTED':
                    break;
                case 'JOB_OFFER_DECLINED':
                    break;
                case 'JOB_OFFER_RESCINDED':
                    break;
                case 'JOB_OFFER_EXPIRED':
                    break;
                case 'REJECTED':
                    result = ['NEW', 'REVIEW'];
                    break;
            }
            return result;
        }
    }, {
        /* ACTIONS */
        
        VIEW_APPLICATION: 'view-application',

        UPDATE_APPLICATION_STATUS: 'update-status',

        MAKE_INTERVIEW_OFFER: 'make-interivew-offer',

        RESCIND_INTERVIEW_OFFER: 'rescind-interview-offer'

        
    });

    return {
        ApplicationHandler: ApplicationHandler
    };
});
