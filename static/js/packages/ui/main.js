define(/** @exports core */[
    './ac/inputhandler',
    './ac/matcher',
    './ac/views',
    './collection/views',
    './date/views',
    './drop/views',
    './events/keycodes',
    './events/type',
    './facet/views',
    './filter/models',
    './filter/views',
    './form/actions',
    './form/comparators',
    './form/fields',
    './form/formatters',
    './form/models',
    './form/stores',
    './form/validators',
    './form/views',
    './grid/views',
    './input/views',
    './load/views',
    './menu/models',
    './menu/views',
    './modal/views',
    './paginator/views',
    './rating/stars/views',
    './scroll/views',
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
    events_keycodes,
    events_type,
    facet_views,
    filter_models,
    filter_views,
    form_actions,
    form_comparators,
    form_fields,
    form_formatters,
    form_models,
    form_stores,
    form_validators,
    form_views,
    grid_views,
    input_views,
    load_views,
    menu_models,
    menu_views,
    modal_views,
    paginator_views,
    rating_stars_views,
    scroll_views,
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
        events: {
            kc: events_keycodes,
            type: events_type
        },
        facet: {
            views: facet_views
        },
        filter: {
            model: filter_models,
            views: filter_views
        },
        form: {
            actions: form_actions,
            comparators: form_comparators,
            fields: form_fields,
            formatters: form_formatters,
            models: form_models,
            stores: form_stores,
            validators: form_validators,
            views: form_views
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
        scroll: {
            views: scroll_views
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
