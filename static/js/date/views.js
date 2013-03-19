define([
    'jquery',
    'underscore',
    'globalize',
    'core/date',
    'core/factory',
    'core/iter',
    'core/view',
    'drop/views',
    'text!date/templates/date_month.html',
    'text!date/templates/date_picker.html',
    'text!date/templates/date_range.html'
], function(
    $,
    _,
    Globalize,
    date,
    factory,
    iter,
    view,
    drop_views,
    date_month_template,
    date_picker_template,
    date_range_template) {

    var EVENTS = {
        DATE_CHANGED: 'DATE_CHANGED_EVENT',
        DATE_RANGE_CHANGED: 'DATE_RANGE_CHANGED_EVENT'
    };

    /**
     * Date Month View.
     * @constructor
     * @param {Object} options
     *   model: {Model} model (required)
     *   attribute: {String} model attribute (required)
     */
    var DateMonthView = view.View.extend({

        defaultTemplate: date_month_template,

        events: {
            'click .day': 'onClickDay',
            'click .next': 'onClickNext',
            'click .prev': 'onClickPrev'
        },
        
        initialize: function(options) {
            options = options || {};
            this.template = _.template(this.defaultTemplate);
            this.model = options.model;
            this.attribute = options.attribute;
            this.daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Tu', 'Fr', 'Sa'];
            this.months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

            if(!this.model) {
                this.model = new Backbone.Model({date: null});
                this.attribute = 'date';
            }

            this.listenTo(this.model, 'change:' + this.attribute, this.render);
        },

        classes: function() {
            return ['date-month'];
        },

        getDate: function() {
            return this.model.get(this.attribute);
        },

        setDate: function(value) {
            this.model.set(this.attribute, value);
            return this;
        },

        render: function() {
            var context = this.context();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        },

        context: function() {
            var days, weeks = [];
            var current = this.getDate();
            var today = new date.Date();
            var range = date.DateRange.calendarMonth(current || today).iterator();
            var month = current ? current.getMonth() : today.getMonth();
            var year = current ? current.getFullYear() : today.getFullYear();

            var addDay = function(datetime) {
                days.push({
                    timestamp: datetime.getTime(),
                    month: datetime.getMonth() + 1,
                    date: datetime.getDate(),
                    year: datetime.getFullYear(),
                    leftover: datetime.getMonth() !== month,
                    selected: datetime.equals(current)
                });
            };

            while(true) {
                days = [];
                iter.forEach(iter.slice(range, 0, 7), addDay);
                
                if(days.length) {
                    weeks.push(days);
                } else {
                    break;
                }
            }

            return {
                daysOfWeek: this.daysOfWeek,
                month: this.months[month],
                year: year,
                weeks: weeks
            };
        },

        onClickDay: function(e) {
            var target = $(e.currentTarget);
            var timestamp = target.data('timestamp');
            var datetime = new date.Date(new Date(timestamp));
            if(!datetime.equals(this.getDate())) {
                this.setDate(datetime.clone());
                this.triggerEvent(EVENTS.DATE_CHANGED, {
                    date: datetime
                });
            }
        },

        onClickNext: function(e) {
            var datetime = this.getDate() || new date.Date();
            datetime = datetime.clone().add(new date.Interval(0, 1));
            this.setDate(datetime);
            this.triggerEvent(EVENTS.DATE_CHANGED, {
                date: datetime
            });
        },

        onClickPrev: function(e) {
            var datetime = this.getDate() || new date.Date();
            datetime = datetime.clone().add(new date.Interval(0, -1));
            this.setDate(datetime);
            this.triggerEvent(EVENTS.DATE_CHANGED, {
                date: datetime
            });
        }
    });



    /**
     * Date Picker View.
     * @constructor
     * @param {Object} options
     *   model: {Model} model (required)
     *   attribute: {String} model attribute (required)
     */
    var DatePickerView = view.View.extend({

        defaultTemplate: date_picker_template,

        events: {
        },
        
        initialize: function(options) {
            options = options || {};
            this.template = _.template(this.defaultTemplate);
            this.model = options.model;
            this.attribute = options.attribute;

            if(!this.model) {
                this.model = new Backbone.Model({date: null});
                this.attribute = 'date';
            }

            //child views
            this.monthView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.monthView = new DateMonthView({
                model: this.model,
                attribute: this.attribute
            });
        },

        childViews: function() {
            return [this.monthView];
        },

        classes: function() {
            return ['date-picker'];
        },

        render: function() {
            this.$el.html(this.template());
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.monthView);
            return this;
        },

        getDate: function() {
            return this.model.get(this.attribute);
        },

        setDate: function(date) {
            this.model.set(this.attribute, date);
            return this;
        }
    });

    /**
     * Date Picker Drop View.
     * @constructor
     * @param {Object} options
     *   model: {Model} model (required)
     *   attribute: {String} model attribute (required)
     *   inputView: {View}
     *   inputSelector: {String}
     *   autoclose: {Boolean} (optional) 
     *   autocloseGroup: {String} (optional)
     *   group: {String}
     */
    var DatePickerDropView = view.View.extend({

        events: {
        },
        
        initialize: function(options) {
            options = _.extend({
                autoclose: true
            }, options);
            this.model = options.model;
            this.attribute = options.attribute;
            this.inputView = options.inputView;
            this.inputSelector = options.inputSelector;
            this.autoclose = options.autoclose;
            this.autocloseGroup = options.autocloseGroup;
            this.formats = ['MM/dd/yyyy'];

            if(!this.model) {
                this.model = new Backbone.Model({date: null});
                this.attribute = 'date';
            }

            //bind events
            this.listenTo(this.model, 'change:' + this.attribute, this.onDateChanged);

            //child views
            this.dropView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            var viewFactory = new factory.Factory(DatePickerView, {
                model: this.model,
                attribute: this.attribute
            });

            this.dropView = new drop_views.DropView({
                autoclose: this.autoclose,
                autocloseGroup: this.autocloseGroup,
                targetView: this.inputView,
                targetSelector: this.inputSelector,
                view: viewFactory
            });
        },

        childViews: function() {
            return [this.dropView];
        },

        input: function() {
            return this.inputView.$(this.inputSelector);
        },

        updateInput: function() {
            var fmt, currentDate = this.getDate();
            if(currentDate) {
                fmt = Globalize.format(currentDate.date, this.formats[0]);
                this.input().val(fmt);
            }
        },

        delegateEventName: function(eventName) {
            //use delegate events so they're removed on destroy()
            return eventName + '.delegateGlobalEvents' + this.cid;
        },

        delegateEvents: function() {
            view.View.prototype.delegateEvents.apply(this, arguments);
            this.input().on(this.delegateEventName('focus'), _.bind(this.onFocus, this));
            this.input().on(this.delegateEventName('blur'), _.bind(this.onBlur, this));
            this.input().on(this.delegateEventName('keyup'), _.bind(this.onKeyUp, this));
        },

        undelegateEvents: function() {
            this.input().off(this.delegateEventName(''));
            view.View.prototype.undelegateEvents.apply(this, arguments);
        },

        classes: function() {
            return ['date-picker-drop'];
        },

        render: function() {
            this.$el.html();
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.dropView);
            this.updateInput();
            return this;
        },

        getDate: function() {
            return this.model.get(this.attribute);
        },

        setDate: function(date) {
            this.model.set(this.attribute, date);
            return this;
        },

        onDateChanged: function(model) {
            this.updateInput();
        },

        onFocus: function(e) {
            this.dropView.autoclose = false;
            this.dropView.open();
        },

        onBlur: function(e) {
            this.dropView.autoclose = true;
        },

        onKeyUp: function(e) {
            var newDate;
            var currentDate = this.getDate();
            var value = this.input().val();
            var update = false;

            if(value) {
                newDate = Globalize.parseDate(value, this.formats);
                if(newDate) {
                    update = true;
                    newDate = new date.Date(newDate);
                }
            } else {
                newDate = null;
                update = true;
            }
            
            if(update) {
                if((newDate && currentDate && !currentDate.equals(newDate)) ||
                   newDate !== currentDate) {
                    this.setDate(newDate);
                    this.triggerEvent(EVENTS.DATE_CHANGED, {
                        date: newDate
                    });
                }
            }
        }
    });

    /**
     * Date Range View.
     * @constructor
     * @param {Object} options
     *   model: {Model} model (required)
     *   attribute: {String} model attribute (required)
     */
    var DateRangeView = view.View.extend({

        defaultTemplate: date_range_template,

        events: {
            'change input:radio': 'onRadioChanged',
            'focus .between-start': 'onBetweenFocused',
            'focus .between-end': 'onBetweenFocused',
            'DATE_CHANGED_EVENT': 'onDateChanged'
        },
        
        initialize: function(options) {
            options = _.extend({
                template: this.defaultTemplate,
                range: date.DateRange.allTime()
            }, options);

            this.template = _.template(options.template);
            this.mode = options.mode;
            this.startModel = options.startModel;
            this.startAttribute = options.startAttribute;
            this.endModel = options.endModel;
            this.endAttribute = options.endAttribute;
            
            if(!this.startModel) {
                this.startModel = new Backbone.Model({date: null});
                this.startAttribute = 'date';
            }
            if(!this.endModel) {
                this.endModel = new Backbone.Model({date: null});
                this.endAttribute = 'date';
            }

            //bind events
            this.listenTo(this.startModel, 'change:' + this.startAttribute, this.onModelChanged);
            this.listenTo(this.endModel, 'change:' + this.endAttribute, this.onModelChanged);

            //child views
            this.startDateView = null;
            this.endDateView = null;
            this.initChildViews();

            //set initial range
            this.setDateRange(options.range);
        },

        childViews: function() {
            return [this.startDateView, this.endDateView];
        },

        initChildViews: function() {
            this.startDateView = new DatePickerDropView({
                autocloseGroup: this.cid,
                inputView: this,
                inputSelector: '.between-start'
            });

            this.endDateView = new DatePickerDropView({
                inputView: this,
                inputSelector: '.between-end'
            });
        },

        classes: function() {
            return ['date-range'];
        },

        context: function() {
            return {
                mode: this.mode
            };
        },

        render: function() {
            this.$el.html(this.template(this.context()));
            this.$el.attr('class', this.classes().join(' '));
            this.append(this.startDateView);
            this.append(this.endDateView);
            return this;
        },

        getStartDate: function() {
            return this.startModel.get(this.startAttribute);
        },

        setStartDate: function(startDate, options) {
            this.startModel.set(this.startAttribute, startDate, options);
            return this;
        },

        getEndDate: function() {
            return this.endModel.get(this.endAttribute);
        },

        setEndDate: function(endDate, options) {
            this.endModel.set(this.endAttribute, endDate, options);
            return this;
        },

        getDateRange: function() {
            return new date.DateRange(
                    this.getStartDate(),
                    this.getEndDate());
        },

        setDateRange: function(range) {
            this.setStartDate(range.start, {silent: true});
            this.setEndDate(range.end);
            return this;
        },

        onModelChanged: function(model) {
            var mode, selector;
            var range = this.getDateRange();
            
            if(date.DateRange.allTime().equals(range)) {
                mode = 'all';
            } else if(date.DateRange.today().equals(range)) {
                mode = 'today';
            } else if(date.DateRange.thisWeek().equals(range)) {
                mode = 'week';
            } else if(date.DateRange.thisMonth().equals(range)) {
                mode = 'month';
            } else {
                mode = 'between';
            }

            if(mode !== this.mode) {
                this.mode = mode;
                selector = 'input:radio[value=' + mode + ']';
                this.$(selector).attr('checked', 'checked');
            }

            if(this.mode === 'between') {
                this.startDateView.setDate(range.start ? range.start.clone() : null);
                this.endDateView.setDate(range.end ? range.end.clone() : null);
            }
        },

        onRadioChanged: function(e) {
            var range;
            var target = $(e.currentTarget);
            var mode = target.val();

            switch(mode) {
                case 'all':
                    range = date.DateRange.allTime();
                    break;
                case 'today':
                    range = date.DateRange.today();
                    break;
                case 'week':
                    range = date.DateRange.thisWeek();
                    break;
                case 'month':
                    range = date.DateRange.thisMonth();
                    break;
                case 'between':
                    range = new date.DateRange(
                                this.startDateView.getDate(),
                                this.endDateView.getDate());
                    break;
            }

            this.setDateRange(range);
            this.triggerEvent(EVENTS.DATE_RANGE_CHANGED, {
                dateRange: this.getDateRange()
            });
        },

        onDateChanged: function(e) {
            this.setDateRange(new date.DateRange(
                this.startDateView.getDate(),
                this.endDateView.getDate()));
            this.triggerEvent(EVENTS.DATE_RANGE_CHANGED, {
                dateRange: this.getDateRange()
            });
        },

        onBetweenFocused: function(e) {
            if(this.mode !== 'between') {
                var range = new date.DateRange(
                            this.startDateView.getDate(),
                            this.endDateView.getDate());
                this.setDateRange(range);
            }
        }
    });

    return {
        EVENTS: EVENTS,
        DatePickerView: DatePickerView,
        DatePickerDropView: DatePickerDropView,
        DateRangeView: DateRangeView
    };

});
