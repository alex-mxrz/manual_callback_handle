import * as bot_types from '../../types/bot.ts';
import * as grammy    from '../../types/grammy.ts';

import {basic_conversation} from './basic.conversation.ts';
import {language_handler} from './language.ts';

export class commands_handler extends basic_conversation {
    public static async on_start( conversation: bot_types.conversation, context: bot_types.context ): Promise< void > {
        // Check if the conversation and context are valid
        // If they are not, skip handling
        if ( !conversation || !context )
            return;

        // Get the user from context
        const user = context.from;

        if ( !user )
            throw new Error( `@commands_handler::on_start -> Failed to get the user, user is ${user}` );

        // Get the user locale
        const locale = language_handler.parse_locale( user.language_code, 'on_start' );

        if ( !locale )
            throw new Error( `@commands_handler::on_start -> Failed to parse the locale, locale is ${locale}` );

        // Send the message
        await context.reply( locale[ 'welcome_message' ].text, locale[ 'welcome_message' ].options );

        // Wait for the language choice
        context = await commands_handler.wait_for_language( conversation );
    }

    private static async wait_for_language( conversation: bot_types.conversation ):
        Promise< grammy.bot.CallbackQueryContext< bot_types.context >> {
        if ( !conversation )
            throw new Error( `@commands_handler::wait_for_language -> Failed to get the conversation, conversation is 
                ${conversation}` );

        // Receive new context (after the user has selected the language)
        const context = await conversation.waitForCallbackQuery(
            [
                'cb_language_keep',
                'cb_language_change_en',
                'cb_language_change_uk',
                'cb_language_change_lv',
                'cb_language_change_lt',
                'cb_language_change_ru',
            ],
            { maxMilliseconds : 30000 } );

        if ( !context )
            throw new Error(
                `@commands_handler::wait_for_language -> Failed to get the context, context is ${context}` );

        // Handle the language change
        switch ( context.match ) {
            case 'cb_language_keep' :
                await language_handler.keep_locale( context );
                break;
            case 'cb_language_change_en' :
                await language_handler.change_to_english( context );
                break;
            case 'cb_language_change_uk' :
                await language_handler.change_to_ukrainian( context );
                break;
            case 'cb_language_change_lv' :
                await language_handler.change_to_latvian( context );
                break;
            case 'cb_language_change_lt' :
                await language_handler.change_to_lithuanian( context );
                break;
            case 'cb_language_change_ru' :
                await language_handler.change_to_russian( context );
                break;
            default :
                throw new Error( `@commands_handler::wait_for_language -> Failed to handle the language change, match is
                        ${context.match}` );
        }

        // Return the context
        return context;
    }
}
