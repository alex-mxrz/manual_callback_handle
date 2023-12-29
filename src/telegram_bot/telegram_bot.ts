import * as jsonc from '$jsonc/main.ts';

import * as bot_types    from '../types/bot.ts';
import * as common_types from '../types/common.ts';
import * as grammy       from '../types/grammy.ts';

import {commands_handler} from './handlers/commands.ts';

interface bot_settings {
    m_change_info?: boolean;
}

enum change_status {
    on_start = 'start',
    on_stop  = 'stop',
}

export class telegram_bot {
    constructor( settings: bot_settings = { m_change_info : false } ) {
        if ( !settings )
            throw new Error( `@telegram_bot::constructor -> Failed to construct the class, settings is ${settings}` );

        console.log( '@telegram_bot::constructor -> Initialize the telegram bot' );

        // Set the settings
        this.m_settings = settings;

        // Parse the configuration settings
        const configuration: common_types.raw_data = this.parse_configuration( );

        // Get the bot token
        const bot_token: string = configuration[ 'token' ] as string;

        if ( !bot_token )
            throw new Error( `@telegram_bot::constructor -> Failed to get the bot token, bot token is ${bot_token}` );

        console.log( `@telegram_bot::constructor -> Bot token is "${bot_token}"` );

        // Create the instance of the bot
        this.m_bot = new grammy.bot.Bot< bot_types.context >( bot_token );

        if ( !this.m_bot )
            throw new Error(
                `@telegram_bot::constructor -> Failed to create the instance of the bot, bot is ${this.m_bot}` );

        // Use the limitter middleware (2 request per 1s)
        this.m_bot.use( grammy.limitter.limit( { timeFrame : 1000, limit : 2 } ) );

        // Use the session middleware
        this.m_bot.use( grammy.bot.session( {
            // Register the session data
            initial : ( ) : bot_types.session_data => ( { m_language : { m_is_switched : undefined } } ),
        } ) );

        // Use the conversation middleware
        this.m_bot.use( grammy.conversations.conversations( ) );
    }

    public async start( ): Promise< void > {
        if ( !this.m_bot )
            throw new Error( `@telegram_bot::start -> Failed to start the bot, bot is ${this.m_bot}` );

        // Check if the information about the bot should be changed
        // If it is, change the information about the bot
        if ( this.m_settings.m_change_info )
            await this.change_info( change_status.on_start );

        // Handle the messages
        this.handle_messages( );

        // Try to catch grammy errors
        this.m_bot.catch( error => console.error( `@telegram_bot::start -> Error is ${error}` ) );

        console.log( '@telegram_bot::start -> Start the telegram bot' );

        // Start the runner of bot
        this.m_runner = grammy.runner.run( this.m_bot );
    }

    public stop( ): void {
        if ( !this.m_bot )
            throw new Error( `@telegram_bot::stop -> Failed to stop the bot, bot is ${this.m_bot}` );

        // Create the lambda function to stop the runner
        const stop_runner = async ( ) => {
            // Check if the information about the bot should be changed
            // If it is, change the information about the bot
            if ( this.m_settings.m_change_info )
                await this.change_info( change_status.on_stop );

            // Check if the runner active
            // If it is, stop the runner
            if ( this.m_runner.isRunning( ) )
                await this.m_runner.stop( );

            console.log( '@telegram_bot::stop -> Stop the telegram bot' );

            // Exit the process
            Deno.exit( 0 );
        };

        // Add the listener to the signal
        Deno.addSignalListener( 'SIGINT', stop_runner );
    }

    private parse_configuration( ): common_types.raw_data {
        // Read the configuration file
        const configuration_file: string = Deno.readTextFileSync( 'configurations/bot.jsonc' );

        if ( !configuration_file )
            throw new Error(
                `@telegram_bot::parse_configurations -> Failed to read the configuration file, configuration file is 
                    ${configuration_file}` );

        // Parse the configuration file
        const configuration: common_types.raw_data = jsonc.parse( configuration_file );

        if ( !configuration )
            throw new Error(
                `@telegram_bot::parse_configurations -> Failed to parse the configuration file, configuration is 
                    ${configuration}` );

        // Return the configuration settings
        return configuration;
    }

    private async change_info( status: change_status ): Promise< void > {
        if ( !this.m_bot )
            throw new Error( `@telegram_bot::change_info -> Failed to change the information about the bot, bot is 
            ${this.m_bot}` );

        // Parse the configuration file
        const configuration: common_types.raw_data = this.parse_configuration( );

        if ( !configuration )
            throw new Error( `@telegram_bot::change_info -> Failed to parse the configuration file, configuration is
                ${configuration}` );

        // Get the information about the bot
        const status_info: common_types.raw_data = configuration[ 'status_info' ] as common_types.raw_data;

        if ( !status_info )
            throw new Error( `@telegram_bot::change_info -> Failed to get the information about the bot, status info is
                ${status_info}` );

        // Get the current status
        const current_status = status_info[ status as string ] as {
            name: string;
            description: string;
            short_description: string;
        };

        if ( !current_status )
            throw new Error( `@telegram_bot::change_info -> Failed to get the current status, current status is 
                ${current_status}` );

        // Check if the current name should be changed
        if ( ( await this.m_bot.api.getMyName( ) ).name !== current_status.name ) {
            // Change the name of the bot
            if ( !( await this.m_bot.api.setMyName( current_status.name ) ) ) {
                throw new Error( `@telegram_bot::change_info -> Failed to change the name of the bot, current status is 
                    ${current_status}` );
            }
        }

        // Check if the current description should be changed
        if ( ( await this.m_bot.api.getMyDescription( ) ).description !== current_status.description ) {
            // Change the description of the bot
            if ( !( await this.m_bot.api.setMyDescription( current_status.description ) ) ) {
                throw new Error( `@telegram_bot::change_info -> Failed to change the description of the bot, current 
                    status is ${current_status}` );
            }
        }

        // Check if the current short description should be changed
        if ( ( await this.m_bot.api.getMyShortDescription( ) ).short_description !== current_status.description ) {
            // Change the description of the bot
            if ( !( await this.m_bot.api.setMyShortDescription( current_status.short_description ) ) ) {
                throw new Error( `@telegram_bot::change_info -> Failed to change the short description of the bot,
                    current status is ${current_status}` );
            }
        }

        // Delete all commands for private chats
        if ( !( await this.m_bot.api.deleteMyCommands( ) ) ) {
            throw new Error( '@telegram_bot::change_info -> Failed to delete all commands for private chats' );
        }

        // Check if the commands should be changed (only in bot start)
        if ( status === change_status.on_start ) {
            // Get the array of commands data
            const handler = configuration[ 'commands_handler' ] as [ {
                                scope: grammy.types.BotCommandScope;
                                commands: grammy.types.BotCommand[];
                            } ];

            if ( !handler )
                throw new Error( `@telegram_bot::change_info -> Failed to get the commands handler, handler is 
                    ${handler}` );

            // Create the array of promises
            // So don`t wait in iteration? Wait for all promises in the end
            const promises: Promise< boolean >[] = [];

            // Loop through the array of commands data
            for ( const data of handler ) {
                if ( !data.scope || !data.commands )
                    throw new Error( `@telegram_bot::change_info -> Failed to get the commands data, data is ${data}` );

                // Add the promise to the array
                promises.push( this.m_bot.api.setMyCommands( data.commands, { scope : data.scope } ) );
            }

            // Wait for all commands to be set
            await Promise.all( promises );
        }
    }

    private handle_messages( ): void {
        if ( !this.m_bot )
            throw new Error( `@telegram_bot::handle_messages -> Failed to handle the messages, bot is ${this.m_bot}` );

        console.log( '@telegram_bot::handle_messages -> Try to register the conversations' );

        // Use the register conversation middleware
        this.m_bot.use( ...this.register_conversation( [
            // Add the conversation for commands
            commands_handler.register_conversation( ),
        ] ) );

        console.log(
            '@telegram_bot::handle_messages -> Conversations are registered\n@telegram_bot::handle_messages -> Try to register the commands' );

        // Handle '/start' command
        this.m_bot.command( 'start',
                            async ( context: bot_types.context ) => await context.conversation.enter( 'on_start' ) );

        console.log( '@telegram_bot::handle_messages -> Commands are registered, handling is started' );
    }

    private register_conversation( functions_array: grammy.conversations.ConversationFn< bot_types.context >[][] ):
        grammy.bot.MiddlewareFn< bot_types.context&grammy.conversations.ConversationFlavor >[] {
        if ( !functions_array )
            throw new Error( `@telegram_bot::register_conversation -> Failed to register the conversation,
                functions array is ${functions_array}` );

        // Create the array of registered conversations
        const conversations = [];

        // Iterate over the array of functions (that will be registered)
        for ( const register_functions of functions_array ) {
            // Check if the array of functions is valid
            // If it is not, skip handling
            if ( !register_functions )
                continue;

            // Iterate over the array of functions
            for ( const func of register_functions ) {
                // Check if the function is valid
                // If it is not, skip handling
                if ( !func )
                    continue;

                // Push the registered conversation to the array
                conversations.push( grammy.conversations.createConversation( func ) );
            }
        }

        // Return the array of registered conversations
        return conversations;
    }

    private m_settings: bot_settings;
    private m_bot: grammy.bot.Bot< bot_types.context >;
    private m_runner!: grammy.runner.RunnerHandle;
}
