define([
    'jquery',
    'underscore',
    'core/base',
    'talent/events'
], function(
    $,
    _,
    base,
    talent_events) {
    
    var ApplicantHandler = base.Base.extend({

        initialize: function(options) {
            this.model = options.model;
            this.view = options.view;
        },

        updateApplicationStatus: function(status) {
            if(this.isValidStatusChange(status)) {
                this.view.triggerEvent(talent_events.UPDATE_APPLICATION_STATUS, {
                    model: this.model,
                    status: status
                });
            }
        },

        makeInterviewOffer: function() {
            this.view.triggerEvent(talent_events.SHOW_MAKE_INTERVIEW_OFFER, {
                model: this.model
            });
        },

        rescindInterviewOffer: function() {
            this.view.triggerEvent(talent_events.SHOW_RESCIND_INTERVIEW_OFFER, {
                model: this.model
            });
        },

        menuItems: function() {
            var showOfferDivider = this.isValidStatusChange('REVIEW') &&
                (this.isValidAction(ApplicantHandler.MAKE_INTERVIEW_OFFER) ||
                 this.isValidAction(ApplicantHandler.RESCIND_INTERVIEW_OFFER));

            return [
                { key: 'review', label: 'Review',
                  handler: _.bind(this.updateApplicationStatus, this, 'REVIEW'),
                  visible: this.isValidStatusChange('REVIEW')
                },
                { key: 'divider', visible: showOfferDivider},
                { key: 'make-interview_offer', label: 'Make Interview Offer',
                  handler: _.bind(this.makeInterviewOffer, this),
                  visible: this.isValidAction(ApplicantHandler.MAKE_INTERVIEW_OFFER)
                },
                { key: 'rescind-interview_offer', label: 'Rescind Interview Offer',
                  handler: _.bind(this.rescindInterviewOffer, this),
                  visible: this.isValidAction(ApplicantHandler.RESCIND_INTERVIEW_OFFER)
                },
                { key: 'divider',
                  visible: this.isValidStatusChange('REJECTED')
                },
                { key: 'reject', label: 'Reject',
                  handler: _.bind(this.updateApplicationStatus, this, 'REJECTED'),
                  visible: this.isValidStatusChange('REJECTED')
                }
            ];
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
                        ApplicantHandler.UPDATE_APPLICATION_STATUS,
                        ApplicantHandler.MAKE_INTERVIEW_OFFER];
                    break;
                case 'INTERVIEW_OFFER_PENDING':
                    result = [ApplicantHandler.RESCIND_INTERVIEW_OFFER];
                    break;
                case 'INTERVIEW_OFFER_ACCEPTED':
                    result = [ApplicantHandler.UPDATE_APPLICATION_STATUS];
                    break;
                case 'INTERVIEW_OFFER_DECLINED':
                    result = [ApplicantHandler.UPDATE_APPLICATION_STATUS];
                    break;
                case 'INTERVIEW_OFFER_RESCINDED':
                    result = [
                        ApplicantHandler.UPDATE_APPLICATION_STATUS,
                        ApplicantHandler.MAKE_INTERVIEW_OFFER];
                    break;
                case 'INTERVIEW_OFFER_EXPIRED':
                    result = [ApplicantHandler.UPDATE_APPLICATION_STATUS];
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
                    result = [ApplicantHandler.UPDATE_APPLICATION_STATUS];
                    break;
            }
            return result;
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

        UPDATE_APPLICATION_STATUS: 'update-status',

        MAKE_INTERVIEW_OFFER: 'make-interivew-offer',

        RESCIND_INTERVIEW_OFFER: 'rescind-interview-offer'
    });

    return {
        ApplicantHandler: ApplicantHandler
    };
});
