# Ollama LLM Integration Setup

## Prerequisites

1. **Ollama installed and running** on your MacBook

   - Ollama should be accessible at `http://localhost:11434`
   - Verify with: `curl http://localhost:11434/api/tags`

2. **LLM Model downloaded**
   - The default model is `llama3.2`
   - To download: `ollama pull llama3.2`
   - To use a different model, modify `main/services/llm.ts`

## How It Works

### LLM Service (`main/services/llm.ts`)

- Handles communication with Ollama API
- Default endpoint: `http://localhost:11434`
- Default model: `llama3.2`
- Provides `generateResponse()` method for chat completion

### Villager NPC (`main/events/villager.ts`)

- Uses LLM service for dynamic conversation
- Maintains conversation history per player
- Provides free-form chat experience with choice-based interaction
- Context-aware: includes player name and location in system prompt

## Configuration

### Change Default Model

Edit `main/services/llm.ts`:

```typescript
constructor(baseUrl: string = 'http://localhost:11434', defaultModel: string = 'your-model-name') {
    // ...
}
```

### Change Ollama URL

If Ollama is running on a different host/port:

```typescript
export const llmService = new LLMService("http://your-host:11434", "llama3.2");
```

## Usage

1. Start your game: `npm run dev`
2. Interact with the villager NPC
3. The NPC will use Ollama to generate dynamic responses
4. Conversation history is maintained throughout the session

## Available Models

Check available models:

```bash
ollama list
```

Pull a different model:

```bash
ollama pull llama3.1
ollama pull mistral
ollama pull gemma
```

Then update the model name in the LLM service.

## Troubleshooting

### Ollama not running

- Start Ollama: The service should auto-start, or run `ollama serve`

### Model not found

- Download the model: `ollama pull llama3.2`
- Or change the default model in `llm.ts` to one you have

### Connection errors

- Verify Ollama is accessible: `curl http://localhost:11434/api/tags`
- Check firewall settings if using a remote Ollama instance
