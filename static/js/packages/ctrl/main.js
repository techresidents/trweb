define(/** @exports ctrl */[
    'core',
    './commands/applicant',
    './commands/user',
    './proxies/current',
    './proxies/player'
], function(
    core,
    applicant_commands,
    user_commands,
    current_proxies,
    player_proxies) {
    
    return {
        commands: {
            applicant: applicant_commands,
            user: user_commands
        },
        proxies: {
            current: current_proxies,
            player: player_proxies
        }
    };
});
