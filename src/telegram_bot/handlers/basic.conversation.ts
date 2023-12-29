// deno-lint-ignore-file ban-types
import * as bot_types from '../../types/bot.ts';
import * as grammy    from '../../types/grammy.ts';

export class basic_conversation {
    public static register_conversation( ): grammy.conversations.ConversationFn< bot_types.context >[] {
        // Create the array of functions (that will be registered)
        const functions: grammy.conversations.ConversationFn< bot_types.context >[] = [];

        // Get the keys of the class (for static methods)
        const keys = Object.getOwnPropertyNames( this );

        // Iterate over the keys
        for ( const key of keys ) {
            // Get the property descriptor
            const descriptor = Object.getOwnPropertyDescriptor( this, key );

            // Check if the property descriptor is valid
            // If it is not, skip handling
            if ( !descriptor )
                continue;

            // Check if the property descriptor is not a function (static method)
            // If it is not, skip handling
            if ( typeof descriptor.value !== 'function' )
                continue;

            // Check if the property descriptor is a constructor
            // If it is, skip handling
            if ( key === 'constructor' )
                continue;

            // Get the parameter names of the function
            const parameter_names = this.get_parameter_names( descriptor.value );

            // Check if the parameter names are valid
            // If they are not, skip handling
            if ( !parameter_names )
                continue;

            // Check if the function exectly two parameters (conversation and context)
            // If it is not, skip handling
            if ( parameter_names.length !== 2
                 && ( parameter_names[ 0 ] !== 'conversation' || parameter_names[ 1 ] !== 'context' ) )
                continue;

            // Add the function to the array of functions
            functions.push( descriptor.value );
        }

        // Return the array of functions
        return functions;
    }

    private static get_parameter_names( func: Function ): string[] {
        // Get the function string
        const function_string = func.toString( );

        // Get the parameter string (from the function string)
        const parameter_string
            = function_string.slice( function_string.indexOf( '(' ) + 1, function_string.indexOf( ')' ) )
                  .replace( /\s+/g, '' );

        // Check if the parameter string is valid
        // If it is not, skip handling
        if ( !parameter_string )
            return [];

        // Get the parameter names
        const parameter_names = parameter_string.split( ',' );

        // Check if the parameter names are valid
        // If they are not, skip handling
        if ( !parameter_names )
            return [];

        // Return the parameter names
        return parameter_names;
    }
}
