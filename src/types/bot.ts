import * as grammy from '../types/grammy.ts';

interface language_data {
    m_is_switched: boolean|undefined;
    m_language_code?: string;
}

export interface session_data {
    m_language?: language_data;
}

export type context
    = grammy.bot.Context&grammy.bot.SessionFlavor< session_data >&grammy.conversations.ConversationFlavor;

export type conversation = grammy.conversations.Conversation< context >;
