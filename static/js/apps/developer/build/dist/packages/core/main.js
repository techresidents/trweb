define(/** @exports core */[
    './array',
    './base',
    './command',
    './date',
    './facade',
    './factory',
    './format',
    './iter',
    './mediator',
    './notifications',
    './proxy',
    './string',
    './uri',
    './view'
], function(
    array,
    base,
    command,
    date,
    facade,
    factory,
    format,
    iter,
    mediator,
    notifications,
    proxy,
    string,
    uri,
    view) {
    
    return {
        array: array,
        base: base,
        command: command,
        date: date,
        facade: facade,
        factory: factory,
        format: format,
        iter: iter,
        mediator: mediator,
        notifications: notifications,
        proxy: proxy,
        string: string,
        uri: uri,
        view: view
    };
});
