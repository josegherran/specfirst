import { SYSTEM_PROMPT, UPDATE_SPEC_SECTION_TOOL } from './prompts.js';

const API_URL = '/anthropic-api/v1/messages';

export async function streamMessage(messages, onText, onSpecUpdate, onError) {
  let toolCallCount = 0;

  try {
    console.log('[claude.js] Opening stream...');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        stream: true,
        system: SYSTEM_PROMPT,
        tools: [UPDATE_SPEC_SECTION_TOOL],
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`HTTP ${response.status}: ${err}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentToolBlock = null;

    console.log('[claude.js] Reading SSE stream...');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (!data || data === '[DONE]') continue;

        let event;
        try { event = JSON.parse(data); } catch { continue; }

        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          onText(event.delta.text);
        } else if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
          currentToolBlock = { name: event.content_block.name, inputStr: '' };
        } else if (event.type === 'content_block_delta' && event.delta?.type === 'input_json_delta') {
          if (currentToolBlock) currentToolBlock.inputStr += event.delta.partial_json;
        } else if (event.type === 'content_block_stop' && currentToolBlock) {
          try {
            const input = JSON.parse(currentToolBlock.inputStr);
            if (currentToolBlock.name === 'update_spec_section') {
              toolCallCount++;
              onSpecUpdate(input.section, input.content);
              console.log('[claude.js] Tool call:', input.section, input.content);
            }
          } catch (e) {
            console.error('[claude.js] Failed to parse tool input:', e);
          }
          currentToolBlock = null;
        }
      }
    }

    console.log('[claude.js] Stream complete. Tool calls:', toolCallCount);
    return { toolCallCount };
  } catch (err) {
    console.error('[claude.js] streamMessage error:', err);
    onError('Something went wrong. Try again.');
    return { toolCallCount: 0 };
  }
}
