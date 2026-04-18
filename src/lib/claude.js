import { SYSTEM_PROMPT, UPDATE_SPEC_SECTION_TOOL } from './prompts.js';

const API_URL = '/anthropic-api/v1/messages';

async function callStream(messages, onText, onSpecUpdate) {
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
  let stopReason = null;
  let textAccumulator = '';
  const toolBlocks = [];

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

      if (event.type === 'message_delta' && event.delta?.stop_reason) {
        stopReason = event.delta.stop_reason;
      } else if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        textAccumulator += event.delta.text;
        onText(event.delta.text);
      } else if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
        currentToolBlock = { id: event.content_block.id, name: event.content_block.name, inputStr: '' };
      } else if (event.type === 'content_block_delta' && event.delta?.type === 'input_json_delta') {
        if (currentToolBlock) currentToolBlock.inputStr += event.delta.partial_json;
      } else if (event.type === 'content_block_stop' && currentToolBlock) {
        try {
          const input = JSON.parse(currentToolBlock.inputStr);
          if (currentToolBlock.name === 'update_spec_section') {
            toolBlocks.push({ id: currentToolBlock.id, name: currentToolBlock.name, input });
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

  return { text: textAccumulator, toolBlocks, stopReason };
}

export async function streamMessage(messages, onText, onSpecUpdate, onError, getIsLoopComplete) {
  try {
    let conversationMessages = [...messages];
    let totalToolBlocks = [];
    let totalText = '';

    // Loop: keep calling the API as long as stop_reason is "tool_use"
    while (true) {
      console.log('[claude.js] Opening stream, messages:', conversationMessages.length);
      const { text, toolBlocks, stopReason } = await callStream(
        conversationMessages, onText, onSpecUpdate
      );

      totalText += text;
      totalToolBlocks = totalToolBlocks.concat(toolBlocks);

      // Build the assistant message with all content blocks from this turn
      const assistantContent = [];
      if (text) assistantContent.push({ type: 'text', text });
      for (const tb of toolBlocks) {
        assistantContent.push({ type: 'tool_use', id: tb.id, name: tb.name, input: tb.input });
      }
      conversationMessages = [...conversationMessages, { role: 'assistant', content: assistantContent }];

      if (stopReason === 'tool_use' && toolBlocks.length > 0) {
        // Claude is waiting for tool results — send them and loop
        const loopDone = getIsLoopComplete ? getIsLoopComplete() : false;
        const toolResults = toolBlocks.map((tb, i) => ({
          type: 'tool_result',
          tool_use_id: tb.id,
          // On the last tool result, inject the loop completion cue if needed
          content: (loopDone && i === toolBlocks.length - 1)
            ? 'ok. [SYSTEM: All three core sections are now filled. Deliver the closing synthesis now.]'
            : 'ok',
        }));

        conversationMessages = [...conversationMessages, { role: 'user', content: toolResults }];
        console.log('[claude.js] Sending tool results' + (loopDone ? ' (loop complete signal sent)' : '') + ', continuing...');
      } else {
        // stop_reason is "end_turn" — Claude is done
        console.log('[claude.js] Stream complete. Tool calls:', totalToolBlocks.length);
        break;
      }
    }

    return { toolCallCount: totalToolBlocks.length, toolBlocks: totalToolBlocks, finalApiMessages: conversationMessages };
  } catch (err) {
    console.error('[claude.js] streamMessage error:', err);
    onError('Something went wrong. Try again.');
    return { toolCallCount: 0, toolBlocks: [], finalApiMessages: messages };
  }
}
