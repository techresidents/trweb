define([
    'jquery',
    'underscore',
    '../base',
    '../fields'
], function(
    $,
    _,
    api,
    fields) {

    var TenantCollection = api.ApiCollection.extend({
        urlRoot: "/tenants",

        modelConstructor: function() {
            return Tenant;
        }

    });

    var Tenant = api.ApiModel.extend({
        urlRoot: "/tenants",

        collectionConstructor: TenantCollection,

        fields: {
            id: new fields.StringField({primaryKey: true}),
            name: new fields.StringField(),
            domain: new fields.StringField()
        }
    });

    return {
        Tenant: Tenant,
        TenantCollection: TenantCollection
    };
});
