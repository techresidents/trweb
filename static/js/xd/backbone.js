define([
    'jQuery',
    'Underscore',
    'Backbone',
    'xd/xd',
], function($, _, Backbone, xd) {
    
    var methodMap = {
        'create': 'POST',
        'read'  : 'GET',  
        'update': 'PUT',
        'delete': 'DELETE'
    };

    var getUrl = function(object) {
        if(object && object.url) {
            return _.isFunction(object.url) ? object.url() : object.url;
        } else {
            return null;
        }
    };

    var sync = function(method, model, options) {

        var type = methodMap[method];
        var processData = type === 'GET' ? true : false;

        var params = _.extend({
                timeout: 60000,
                headers: {},
        }, options);
        
        if(!params.url) {
            params.url = getUrl(model);
        }

        if(!params.data && model && (method == 'create' || method == 'update')) {
            params.data = JSON.stringify(model.toJSON());
            params.headers['Content-Type'] = 'application/json';
        } 

        xd.xhr.request({
            url: params.url,
            method: type,
            timeout: params.timeout,
            headers: params.headers,
            data: params.data,
            processData: processData,
        }, function(response) {
            params.success(JSON.parse(response.data), response.status);
            if(params.complete) {
                params.complete(true, response);
            }
        }, function(response) {
            params.error(response.data.data, response.data.status);
            if(params.complete) {
                params.complete(false, response);
            }
        }
        );
    };
    
    return {
        sync: sync,
    }
});
