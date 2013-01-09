define([
    'soundmanager2'
], function(soundManager) {
    
    //init soundmanager once
    soundManager.setup({
        url: '/static/js/3ps/soundmanager/swf',
        flashVersion: 9,
        useFlashBlock: false,
        useHighPerformance: true,
        debugMode: false
    });
    
    return soundManager;
});
