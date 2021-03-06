define(/** @exports ctrl */[
    'core',
    './commands/applicant',
    './commands/browser',
    './commands/chat',
    './commands/company',
    './commands/offer',
    './commands/profile',
    './commands/requisition',
    './commands/track',
    './commands/user',
    './proxies/current',
    './proxies/player'
], function(
    core,
    applicant_commands,
    browser_commands,
    chat_commands,
    company_commands,
    offer_commands,
    profile_commands,
    requisition_commands,
    track_commands,
    user_commands,
    current_proxies,
    player_proxies) {
    
    return {
        commands: {
            applicant: applicant_commands,
            browser: browser_commands,
            chat: chat_commands,
            company: company_commands,
            offer: offer_commands,
            profile: profile_commands,
            requisition: requisition_commands,
            track: track_commands,
            user: user_commands
        },
        proxies: {
            current: current_proxies,
            player: player_proxies
        }
    };
});
