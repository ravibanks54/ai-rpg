import { RpgEvent, EventData, RpgPlayer } from '@rpgjs/server'
import { llmService } from '../services/llm'

interface ConversationMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

@EventData({
    name: 'EV-1', 
    hitbox: {
        width: 32,
        height: 16
    }
})
export default class VillagerEvent extends RpgEvent {
    onInit() {
        this.setGraphic('female')
    }

    private getConversationHistory(player: RpgPlayer): ConversationMessage[] {
        return player.getVariable('villager_conversation_history') || []
    }

    private saveConversationHistory(player: RpgPlayer, history: ConversationMessage[]) {
        player.setVariable('villager_conversation_history', history)
    }

    private buildSystemPrompt(player: RpgPlayer): string {
        const location = player.getCurrentMap() || 'unknown location'
        return `You are a friendly villager in a fantasy RPG game. You are talking to ${player.name || 'a traveler'} who is visiting ${location}. 

Keep your responses:
- Short and conversational (1-2 sentences)
- Friendly and helpful
- In character as a simple villager
- Focused on the game world context

Do not break character or mention that you are an AI.`
    }

    private async getAIResponse(player: RpgPlayer, userMessage: string): Promise<string> {
        try {
            const conversationHistory = this.getConversationHistory(player)
            const systemPrompt = this.buildSystemPrompt(player)

            const messages: ConversationMessage[] = [
                ...conversationHistory,
                { role: 'user', content: userMessage }
            ]

            const response = await llmService.generateResponse(messages, undefined, systemPrompt)

            const updatedHistory: ConversationMessage[] = [
                ...messages,
                { role: 'assistant', content: response }
            ]

            this.saveConversationHistory(player, updatedHistory)

            return response
        } catch (error) {
            console.error('AI response error:', error)
            return "I'm having trouble understanding right now. Can we try again later?"
        }
    }

    async onAction(player: RpgPlayer) {
        const conversationHistory = this.getConversationHistory(player)
        const isFirstInteraction = conversationHistory.length === 0

        // Initial greeting from NPC (using LLM for first interaction, otherwise continue conversation)
        let npcGreeting = ''
        if (isFirstInteraction) {
            try {
                const systemPrompt = this.buildSystemPrompt(player)
                const greetingMessages: ConversationMessage[] = [
                    { role: 'user', content: 'Hello! Introduce yourself briefly and ask how you can help.' }
                ]
                npcGreeting = await llmService.generateResponse(greetingMessages, undefined, systemPrompt)
                this.saveConversationHistory(player, [
                    { role: 'user', content: 'Hello!' },
                    { role: 'assistant', content: npcGreeting }
                ])
            } catch (error) {
                console.error('Greeting generation error:', error)
                npcGreeting = 'Hello! How can I help you today?'
            }
        } else {
            npcGreeting = "Hello again! What would you like to talk about?"
        }

        await player.showText(npcGreeting, {
            talkWith: this
        })

        // Conversation loop - allow player to continue chatting
        let continueChatting = true
        while (continueChatting) {
            const playerChoice = await player.showChoices('What would you like to say?', [
                { text: 'Ask about quests', value: 'quests' },
                { text: 'Ask about the town', value: 'town' },
                { text: 'Just chat', value: 'chat' },
                { text: 'Ask for help', value: 'help' },
                { text: 'Say goodbye', value: 'goodbye' }
            ])

            if (!playerChoice) {
                continueChatting = false
                break
            }

            if (playerChoice.value === 'goodbye') {
                const goodbyeResponse = await this.getAIResponse(player, 'Goodbye!')
                await player.showText(goodbyeResponse, {
                    talkWith: this
                })
                continueChatting = false
                break
            }

            // Map choice value to a natural language message
            const userMessages: Record<string, string> = {
                'quests': 'Do you have any quests or tasks I can help with?',
                'town': 'Tell me about this town. What should I know?',
                'chat': 'How are you doing today?',
                'help': 'Is there anything you need help with?'
            }

            const userMessage = userMessages[playerChoice.value] || 'Tell me more.'

            const aiResponse = await this.getAIResponse(player, userMessage)
            
            await player.showText(aiResponse, {
                talkWith: this
            })

            // Ask if player wants to continue
            const continueChoice = await player.showChoices('Continue talking?', [
                { text: 'Yes, keep chatting', value: 'continue' },
                { text: 'No, goodbye', value: 'end' }
            ])

            if (!continueChoice || continueChoice.value === 'end') {
                continueChatting = false
                await player.showText('It was nice talking to you! Come back anytime.', {
                    talkWith: this
                })
            }
        }
    }
} 