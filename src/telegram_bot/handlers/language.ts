import * as bot_types    from '../../types/bot.ts';
import * as common_types from '../../types/common.ts';

interface locale_data {
    [key: string]: {
        text: string,
        options: object,
    };
}

export class language_handler {
    public static parse_locale( language_code: string|undefined, key: string ): locale_data {
        if ( !language_code || !key )
            throw new Error( `@language_handler::parse_locale -> Failed to parse the locale, language code is
                ${language_code} and key is ${key}` );

        try {
            // Parse the locale from 'language_code'.json
            const locale: common_types.raw_data
                = JSON.parse( Deno.readTextFileSync( `configurations/locales/${language_code}.json` ) );

            if ( !locale )
                throw new Error( `@language_handler::parse_locale -> Failed to parse the locale, locale is ${locale}` );

            // Return the parsed locale
            return locale[ key ] as locale_data;
        } catch ( _error ) {
            console.warn( `@language_handler::parse_locale -> Failed to parse the locale, missing locale for
                ${language_code}` );

            // Parse the default locale 'en'
            const locale: common_types.raw_data
                = JSON.parse( Deno.readTextFileSync( `configurations/locales/en.json` ) );

            // Re-throw the error if the default locale is not found
            if ( !locale )
                throw new Error( `@language_handler::parse_locale -> Failed to parse the locale, locale is ${locale}` );

            // Return the parsed locale
            return locale[ key ] as locale_data;
        }
    }

    public static async keep_locale( context: bot_types.context ): Promise< void > {
        // Check if the context is valid
        // If it is not, skip handling
        if ( !context )
            return;

        // Get the user from context
        const user = context.from;

        if ( !user )
            throw new Error( `@language_handler::keep_locale -> Failed to get the user, user is ${user}` );

        // Get the user locale
        const locale = language_handler.parse_locale( user.language_code, 'on_language' );

        if ( !locale )
            throw new Error( `@language_handler::keep_locale -> Failed to parse the locale, locale is ${locale}` );

        // Edit the message
        await context.editMessageText( locale[ 'language_keep' ].text, locale[ 'language_keep' ].options );

        // Set the user language data
        context.session.m_language = {
            m_is_switched : false,
            m_language_code : user.language_code,
        };

        // Answer the callback query
        await context.answerCallbackQuery( );
    }

    public static async change_to_english( context: bot_types.context ): Promise< void > {
        // Check if the context is valid
        // If it is not, skip handling
        if ( !context )
            return;

        // Change the locale
        await language_handler.change_locale( context, 'en' );
    }

    public static async change_to_ukrainian( context: bot_types.context ): Promise< void > {
        // Check if the context is valid
        // If it is not, skip handling
        if ( !context )
            return;

        // Change the locale
        await language_handler.change_locale( context, 'uk' );
    }

    public static async change_to_latvian( context: bot_types.context ): Promise< void > {
        // Check if the context is valid
        // If it is not, skip handling
        if ( !context )
            return;

        // Change the locale
        await language_handler.change_locale( context, 'lt' );
    }

    public static async change_to_lithuanian( context: bot_types.context ): Promise< void > {
        // Check if the context is valid
        // If it is not, skip handling
        if ( !context )
            return;

        // Change the locale
        await language_handler.change_locale( context, 'lt' );
    }

    public static async change_to_russian( context: bot_types.context ): Promise< void > {
        // Check if the context is valid
        // If it is not, skip handling
        if ( !context )
            return;

        // Change the locale
        await language_handler.change_locale( context, 'ru' );
    }

    private static async change_locale( context: bot_types.context, language_code: string ): Promise< void > {
        // Check if the context is valid
        // If it is not, skip handling
        if ( !context )
            return;

        // Get the locale by code
        const locale = language_handler.parse_locale( language_code, 'on_language' );

        if ( !locale )
            throw new Error( `@language_handler::change_locale -> Failed to parse the locale, locale is ${locale}` );

        // Edit the message
        await context.editMessageText( locale[ 'language_change' ].text, locale[ 'language_change' ].options );

        // Set the user language data
        context.session.m_language = {
            m_is_switched : true,
            m_language_code : language_code,
        };

        // Answer the callback query
        await context.answerCallbackQuery( );
    }
}
