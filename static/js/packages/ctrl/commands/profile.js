define([
    'underscore',
    'q',
    'api',
    'core',
    'notifications',
    '../proxies/current'
], function(
    _,
    Q,
    api,
    core,
    notifications,
    current_proxies) {

    /**
     * UpdateUser constructor
     * @constructor
     * @classdesc
     * Update user
     */
    var UpdateUser = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],

        /**
         * Execute Command
         * @param {object} options
         * @param {User} options.model User model to update
         * @param {function} [options.onSuccess] Success callback
         * @param {function} [options.onError] Error callback
         */
        execute: function(options) {
            var model = options.model;
            model.save(null, {
                wait: true,
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this)
            });

            return true;
        },

        onSuccess: function(model) {
            //update current user proxy w/ updated user
            var currentProxy = this.facade.getProxy(
                current_proxies.CurrentProxy.NAME);
            currentProxy.updateCurrentUser(model);

            UpdateUser.__super__.onSuccess.apply(this, arguments);
        }
    });

    /**
     * UpdateSkills constructor
     * @constructor
     * @classdesc
     * Update user skills
     */
    var UpdateSkills = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['collection'],

        /**
         * Execute Command
         * @param {object} options
         * @param {SkillCollection} options.collection Skill 
         *   collection to update
         * @param {function} [options.onSuccess] Success callback
         * @param {function} [options.onError] Error callback
         */
        execute: function(options) {
            var currentUser = new api.models.User({id: 'CURRENT'});
            var collection = options.collection;

            //force user id to be current user
            collection.each(function(skill) {
                skill.set({
                    user_id: currentUser.id
                }, {
                    silent: true
                });
            }, this);

            collection.save({
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this)
            });

            return true;
        }

    });

    /**
     * UpdateLocationPrefs constructor
     * @constructor
     * @classdesc
     * Update location prefs
     */
    var UpdateLocationPrefs = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['collection'],

        /**
         * Execute Command
         * @param {object} options
         * @param {LocationPrefCollection} options.collection LocationPref
         *   collection to update
         * @param {function} [options.onSuccess] Success callback
         * @param {function} [options.onError] Error callback
         */
        execute: function(options) {
            var currentUser = new api.models.User({id: 'CURRENT'});
            var collection = options.collection;

            //force user id to be current user
            collection.each(function(locationPref) {
                locationPref.set({
                    user_id: currentUser.id
                }, {
                    silent: true
                });
            }, this);

            collection.save({
                wait: true,
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this)
            });

            return true;
        }
    });

    /**
     * UpdatePositionPrefs constructor
     * @constructor
     * @classdesc
     * Update position prefs
     */
    var UpdatePositionPrefs = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['collection'],

        /**
         * Execute Command
         * @param {object} options
         * @param {PositionPrefCollection} options.collection PositionPref
         *   collection to update
         * @param {function} [options.onSuccess] Success callback
         * @param {function} [options.onError] Error callback
         */
        execute: function(options) {
            var currentUser = new api.models.User({id: 'CURRENT'});
            var collection = options.collection;

            //force user id to be current user
            collection.each(function(positionPref) {
                positionPref.set({
                    user_id: currentUser.id
                }, {
                    silent: true
                });
            }, this);

            collection.save({
                wait: true,
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this)
            });

            return true;
        }
    });

    /**
     * UpdateTechnologyPrefs constructor
     * @constructor
     * @classdesc
     * Update position prefs
     */
    var UpdateTechnologyPrefs = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['collection'],

        /**
         * Execute Command
         * @param {object} options
         * @param {TechnologyPrefCollection} options.collection TechnologyPref
         *   collection to update
         * @param {function} [options.onSuccess] Success callback
         * @param {function} [options.onError] Error callback
         */
        execute: function(options) {
            var currentUser = new api.models.User({id: 'CURRENT'});
            var collection = options.collection;

            //force user id to be current user
            collection.each(function(technologyPref) {
                technologyPref.set({
                    user_id: currentUser.id
                }, {
                    silent: true
                });
            }, this);

            collection.save({
                wait: true,
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this)
            });

            return true;
        }
    });

    /**
     * UpdateDeveloperProfile constructor
     * @constructor
     * @classdesc
     * Update developer profile
     */
    var UpdateDeveloperProfile = core.command.AsyncCommand.extend({

        /**
         * OnSuccess and onError argument names
         */
        asyncCallbackArgs: ['model', 'response'],

        /**
         * Execute Command
         * @param {object} options
         * @param {DeveloperProfile} options.model Developer profile
         *   model to update
         * @param {function} [options.onSuccess] Success callback
         * @param {function} [options.onError] Error callback
         */
        execute: function(options) {
            var model = options.model;

            model.save(null, {
                wait: true,
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this)
            });

            return true;
        }
    });

    /**
     * UpdateDeveloperAccount constructor
     * @constructor
     * @classdesc
     * Update developer account
     */
    var UpdateDeveloperAccount = core.command.AsyncCommand.extend({

        /**
         * Execute Command
         * @param {object} options
         * @param {User} options.model User model to update.
         *   Note that changes to DeveloperProfile will also
         *   be updated.
         * @param {function} [options.onSuccess] Success callback
         * @param {function} [options.onError] Error callback
         */
        execute: function(options) {
            var model = options.model;
            var updateUser = Q.defer();
            var updateDeveloperProfile = Q.defer();

            this.facade.trigger(notifications.UPDATE_USER, {
                model: model,
                onSuccess: updateUser.resolve,
                onError: updateUser.reject
            });

            this.facade.trigger(notifications.UPDATE_DEVELOPER_PROFILE, {
                model: model.get_developer_profile(),
                onSuccess: updateDeveloperProfile.resolve,
                onError: updateDeveloperProfile.reject
            });

            Q.all([updateUser.promise, updateDeveloperProfile.promise])
            .spread(_.bind(this.promiseSuccess, this),
                    _.bind(this.promiseError, this))
            .done();
        },

        promiseSuccess: function(updateUserResult,
                                updateDeveloperProfileResult) {
            this.onSuccess();
        },

        promiseError: function(result) {
            this.onError();
        }
    });

    /**
     * UpdateDeveloperPreferences constructor
     * @constructor
     * @classdesc
     * Update developer preferences
     */
    var UpdateDeveloperPreferences = core.command.AsyncCommand.extend({

        /**
         * Execute Command
         * @param {object} options
         * @param {User} optios.model User containing location prefs,
         *   position prefs, and technology prefs to update.
         * @param {function} [options.onSuccess] Success callback
         * @param {function} [options.onError] Error callback
         */
        execute: function(options) {
            var model = options.model;
            var locationPrefs = Q.defer();
            var positionPrefs = Q.defer();
            var technologyPrefs = Q.defer();
            var promises = [
                locationPrefs.promise,
                positionPrefs.promise,
                technologyPrefs.promise
            ];

            this.facade.trigger(notifications.UPDATE_LOCATION_PREFS, {
                collection: model.get_location_prefs(),
                onSuccess: locationPrefs.resolve,
                onError: locationPrefs.reject
            });

            this.facade.trigger(notifications.UPDATE_POSITION_PREFS, {
                collection: model.get_position_prefs(),
                onSuccess: positionPrefs.resolve,
                onError: positionPrefs.reject
            });

            this.facade.trigger(notifications.UPDATE_TECHNOLOGY_PREFS, {
                collection: model.get_technology_prefs(),
                onSuccess: technologyPrefs.resolve,
                onError: technologyPrefs.reject
            });
            
            Q.all(promises)
            .spread(_.bind(this.promiseSuccess, this),
                    _.bind(this.promiseError, this))
            .done();
        },

        promiseSuccess: function() {
            this.onSuccess();
        },

        promiseError: function(result) {
            this.onError();
        }
    });


    return {
        UpdateUser: UpdateUser,
        UpdateSkills: UpdateSkills,
        UpdateLocationPrefs: UpdateLocationPrefs,
        UpdatePositionPrefs: UpdatePositionPrefs,
        UpdateTechnologyPrefs: UpdateTechnologyPrefs,
        UpdateDeveloperProfile: UpdateDeveloperProfile,
        UpdateDeveloperAccount: UpdateDeveloperAccount,
        UpdateDeveloperPreferences: UpdateDeveloperPreferences
    };
});
