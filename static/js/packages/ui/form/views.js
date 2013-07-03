define(/** @exports ui/form/views */[
    './views/forms',
    './views/fields',
    './views/actions'
], function(
    form_views,
    field_views,
    action_views) {

    return _.extend({}, form_views, field_views, action_views);
});
