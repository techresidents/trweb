define(/** @exports ctrl */[
    'core',
    './commands/applicant',
    './commands/browser',
    './commands/chat',
    './commands/user',
    './proxies/current',
    './proxies/player'
], function(
    core,
    applicant_commands,
    browser_commands,
    chat_commands,
    user_commands,
    current_proxies,
    player_proxies) {
    
    return {
        commands: {
            applicant: applicant_commands,
            browser: browser_commands,
            chat: chat_commands,
            user: user_commands
        },
        proxies: {
            current: current_proxies,
            player: player_proxies
        }
    };
});
