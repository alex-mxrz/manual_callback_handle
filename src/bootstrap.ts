import {telegram_bot} from './telegram_bot/telegram_bot.ts';

( async ( ) => {
    // Create a new instance of the telegram_bot class
    const bot: telegram_bot = new telegram_bot( );

    // Start the bot
    await bot.start( );

    // Stop the bot
    bot.stop( );
} )( );
