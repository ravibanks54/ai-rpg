interface ConversationMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

interface OllamaResponse {
    message: {
        role: string
        content: string
    }
    done: boolean
}

export class LLMService {
    private baseUrl: string
    private defaultModel: string

    constructor(baseUrl: string = 'http://localhost:11434', defaultModel: string = 'llama3.2') {
        this.baseUrl = baseUrl
        this.defaultModel = defaultModel
    }

    async generateResponse(
        messages: ConversationMessage[],
        model?: string,
        systemPrompt?: string
    ): Promise<string> {
        try {
            const modelToUse = model || this.defaultModel
            
            // Build messages array with system prompt if provided
            const chatMessages = systemPrompt 
                ? [{ role: 'system', content: systemPrompt }, ...messages]
                : messages

            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: modelToUse,
                    messages: chatMessages,
                    stream: false,
                }),
            })

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
            }

            const data: OllamaResponse = await response.json()
            return data.message.content.trim()
        } catch (error) {
            console.error('LLM Service Error:', error)
            throw error
        }
    }

    async checkModelAvailability(model?: string): Promise<boolean> {
        try {
            const modelToCheck = model || this.defaultModel
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                method: 'GET',
            })

            if (!response.ok) {
                return false
            }

            const data = await response.json()
            const models = data.models || []
            return models.some((m: any) => m.name === modelToCheck || m.name.startsWith(modelToCheck + ':'))
        } catch (error) {
            console.error('Error checking model availability:', error)
            return false
        }
    }
}

export const llmService = new LLMService()

