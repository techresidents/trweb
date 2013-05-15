define(/** @exports api */[
    './base',
    './config',
    './facet',
    './fetcher',
    './fields',
    './loader',
    './models',
    './query',
    './session',
    './struct',
    './utils'
], function(
    base,
    config,
    facet,
    fetcher,
    fields,
    loader,
    models,
    query,
    session,
    struct,
    utils) {
    
    return {
        base: base,
        config: config,
        facet: facet,
        fetcher: fetcher,
        fields: fields,
        loader: loader,
        models: models,
        query: query,
        session: session,
        struct: struct,
        utils: utils
    };
});
