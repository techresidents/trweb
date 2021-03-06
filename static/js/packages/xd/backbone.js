define([
    'jquery',
    'underscore',
    'backbone',
    './xd'
], function($, _, Backbone, xd) {
    
    var methodMap = {
        'create': 'POST',
        'read'  : 'GET',  
        'update': 'PUT',
        'delete': 'DELETE'
    };

    var getUrl = function(object) {
        var result = null;
        if(object && object.url) {
            result =  _.isFunction(object.url) ? object.url() : object.url;
        } 
        return result;
    };

    var sync = function(method, model, options) {
        var type = methodMap[method];
        var processData = type === 'GET' ? true : false;

        var params = _.extend({
                timeout: 60000,
                headers: {}
        }, options);
        
        if(!params.url) {
            params.url = getUrl(model);
        }

        if(!params.data && model && (method === 'create' || method === 'update')) {
            params.data = JSON.stringify(model.toJSON());
            params.headers['Content-Type'] = 'application/json';
        } 
        
        //Work around for ie10 where if data is undefined somehow
        //the string 'undefined' is getting sent to server in 
        //response body. Setting it to null works around the issue.
        if(params.data === undefined) {
            params.data = null;
        }
        
        xd.xhr.request({
            url: params.url,
            method: type,
            timeout: params.timeout,
            headers: params.headers,
            data: params.data,
            processData: processData
        }, function(response) {
            var data = response.data ? JSON.parse(response.data) : response.data;
            params.success(model, data, options);
            if(params.complete) {
                params.complete(true, response);
            }
            model.trigger('sync', model, data, options);
        }, function(response) {
            params.error(model, response.data.data, options);
            if(params.complete) {
                params.complete(false, response);
            }
            model.trigger('error', model, response.data.data, options);
        });

        model.trigger('request', model, null, options);
    };
    
    return {
        sync: sync
    };
});
