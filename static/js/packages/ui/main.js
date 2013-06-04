define(/** @exports core */[
    './ac/inputhandler',
    './ac/matcher',
    './ac/views',
    './collection/views',
    './date/views',
    './drop/views',
    './facet/views',
    './filter/models',
    './filter/views',
    './grid/views',
    './input/views',
    './load/views',
    './menu/models',
    './menu/views',
    './modal/views',
    './paginator/views',
    './rating/stars/views',
    './select/models',
    './select/views',
    './spinner/views',
    './timer/views',
    './template/views'
], function(
    ac_inputhandler,
    ac_matcher,
    ac_views,
    collection_views,
    date_views,
    drop_views,
    facet_views,
    filter_models,
    filter_views,
    grid_views,
    input_views,
    load_views,
    menu_models,
    menu_views,
    modal_views,
    paginator_views,
    rating_stars_views,
    select_models,
    select_views,
    spinner_views,
    timer_views,
    template_views) {
    
    return {
        ac: {
            inputhandler: ac_inputhandler,
            matcher: ac_matcher,
            views: ac_views
        },
        collection:  {
            views: collection_views
        },
        date: {
            views: date_views
        },
        drop: {
            views: drop_views
        },
        facet: {
            views: facet_views
        },
        filter: {
            model: filter_models,
            views: filter_views
        },
        grid: {
            views: grid_views
        },
        input: {
            views: input_views
        },
        load: {
            views: load_views
        },
        menu: {
            models: menu_models,
            views: menu_views
        },
        modal: {
            views: modal_views
        },
        paginator: {
            views: paginator_views
        },
        rating: {
            stars: {
                views: rating_stars_views
            }
        },
        select: {
            models: select_models,
            views: select_views
        },
        spinner: {
            views: spinner_views
        },
        timer: {
            views: timer_views
        },
        template: {
            views: template_views
        }
    };
});
