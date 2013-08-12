define([
    'jquery',
    'underscore',
    'core',
    'text!./templates/paginator.html'
], function(
    $,
    _,
    core,
    paginator_template) {

    var EVENTS = {
    };

    /**
     * Paginator View.
     * @constructor
     * @param {Object} options
     * @param {ApiCollection} options.collection Collection
     */
    var PaginatorView = core.view.View.extend({

        defaultTemplate: paginator_template,

        events: {
            'click .paginator-page': 'onPage'
        },

        initialize: function(options) {
            options = _.extend({
                'prevLabel': 'Prev',
                'nextLabel': 'Next',
                'maxPages': 5,
                template: this.defaultTemplate
            }, options);
            
            this.prevLabel = options.prevLabel;
            this.nextLabel = options.nextLabel;
            this.maxPages = options.maxPages;
            this.template = _.template(options.template);
            this.context = options.context;
            this.collection = options.collection;
            this.query = this.collection.query();

            //bind events
            this.listenTo(this.collection, 'reset', this.render);
        },

        classes: function() {
            return ['paginator'];
        },

        stats: function() {
            var start = 0, end = 0;
            var pageSize = 20, currentPage = 0, totalPages = 0;
            var totalCount = 0;
            var slice = this.query.state.slice();

            if(this.collection.isLoaded()) {
                if(slice) {
                    pageSize = slice.end() - slice.start();
                    if(pageSize === 0) {
                        pageSize = 1;
                    }
                    currentPage = Math.ceil(slice.end() / pageSize);
                } else {
                    pageSize = 20;
                    currentPage = 1;
                }
                
                totalCount = this.collection.meta.total_count;
                if(totalCount) {
                    totalPages = Math.ceil(totalCount / pageSize);
                }             

                if(this.collection.length) {
                    start = (currentPage - 1) * pageSize + 1;
                    end = (currentPage - 1) * pageSize + this.collection.length;
                }
            }

            return {
                pageSize: pageSize,
                currentPage: currentPage,
                totalPages: totalPages,
                totalCount: totalCount,
                start: start,
                end: end,
                length: this.collection.length
            };
        },

        pages: function() {
            var results = [];
            var stats = this.stats();
            var i, startPage, endPage;
            
            if(stats.totalPages - stats.currentPage > Math.floor(this.maxPages / 2)) {
                startPage = Math.max(stats.currentPage - Math.floor(this.maxPages / 2), 1);
                endPage = Math.min(startPage + this.maxPages - 1, stats.totalPages);
            } else {
                endPage = stats.totalPages;
                startPage = Math.max(stats.totalPages - this.maxPages + 1, 1);
            }
            
            results.push({
                label: this.prevLabel,
                page: stats.currentPage > 1 ? stats.currentPage - 1 : startPage,
                disabled: stats.currentPage <= 1
            });

            for(i = startPage; i <= endPage; i++) {
                results.push({
                    label: i.toString(),
                    page: i,
                    disabled: false
                });
            }

            results.push({
                label: this.nextLabel,
                page: stats.currentPage < stats.totalPages ? stats.currentPage + 1 : endPage,
                disabled: stats.currentPage >= stats.totalPages
            });

            return results;
        },

        render: function() {
            var context = _.extend({
                stats: this.stats(),
                pages: this.pages()
            }, core.base.getValue(this, 'context', this));

            this.destroyChildViews();
            this.$el.html(this.template(context));
            this.$el.attr('class', this.classes().join(' '));
            return this;
        },

        next: function() {
            var stats = this.stats();
            if(stats.currentPage !== stats.totalPages) {
                this.query.slice(stats.start + stats.pageSize -1, stats.end + stats.pageSize);
                this.query.fetch();
            }
        },

        prev: function() {
            var stats = this.stats();
            if(stats.currentPage > 1) {
                this.query.slice(stats.start - stats.pageSize -1, stats.end - stats.pageSize);
                this.query.fetch();
            }
        },

        page: function(page) {
            var start, end;
            var stats = this.stats();
            if(page !== stats.currentPage
                && page >= 1
                && page <= stats.totalPages) {
                    start = (page - 1) * stats.pageSize;
                    end = start + stats.pageSize;
                    this.query.slice(start, end);
                    this.query.fetch();
            }
        },

        onPage: function(e) {
            var target = $(e.currentTarget);
            var page = target.data('page');
            this.page(page);
        }
    });

    return {
        EVENTS: EVENTS,
        PaginatorView: PaginatorView
    };

});
