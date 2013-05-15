define([
    'jquery',
    'underscore',
    'backbone',
    'easyXDM'
], function($, _, Backbone, easyXDM) {
    
    var remote = "http://api.techresidents.com/static/js/easyXDM/cors/index.html";
    
    if(window.TR && window.TR.XD && window.TR.XD.remote) {
        remote = TR.XD.remote;
    }

    var xhr = new easyXDM.Rpc({
            remote: remote
    }, {
        remote: {
            request: {}
        }
    });

    return {
        xhr: xhr
    };
});
