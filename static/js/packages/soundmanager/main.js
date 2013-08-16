define([
    'soundmanager2'
], function(soundManager) {
    
    //init soundmanager once
    soundManager.setup({
        url: '/static/js/3ps/soundmanager/swf',
        flashVersion: 9,
        useFlashBlock: false,
        useHighPerformance: false,
        debugMode: false,
        debugFlash: false,
        noSWFCache: false 
    });

    //if document.readystate !== 'complete' the above setup call
    //won't initialize sounderManager, and we'll need to call
    //soundManager.beginDelayedInit() to to initialize it.
    soundManager.beginDelayedInit();
    
    return soundManager;
});
