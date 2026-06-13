/**
 * Llama.cpp proxy — routes Switchboard GraphQL requests through llama.cpp.
 *
 * llama.cpp runs as an OpenAI-compatible API server on localhost:8100.
 * This proxy intercepts Switchboard GraphQL requests and sends them
 * through the LLM for processing/analysis before returning to the client.
 */

const LLAMA_URL = process.env.LLAMA_URL ?? "http://localhost:8100";
const SW_URL = process.env.SWITCHBOARD_URL ?? "http://localhost:4001/graphql";

export interface ProxyOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

/**
 * Send a request through llama.cpp and return the response.
 * Used to route Switchboard GraphQL through the LLM.
 */
export async function proxyThroughLlama(
  prompt: string,
  options: ProxyOptions = {},
): Promise<string> {
  const {
    model = "Qwen3.6-35B-A3B-Q8_0.gguf",
    maxTokens = 4096,
    temperature = 0,
    systemPrompt,
  } = options;

  const res = await fetch(`${LLAMA_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        { role: "user" as const, content: prompt },
      ],
      max_tokens: maxTokens,
      temperature,
      stream: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`llama.cpp request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

/**
 * Proxy a Switchboard GraphQL request through llama.cpp.
 * The prompt contains the GraphQL query, and the LLM processes/analyzes it.
 */
export async function proxyGraphQL(
  query: string,
  variables?: Record<string, unknown>,
  options: ProxyOptions = {},
): Promise<{ raw: Record<string, unknown>; processed: string }> {
  // First, get the raw Switchboard response
  const rawRes = await fetch(SW_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const raw = await rawRes.json();

  // Send through llama.cpp for processing
  const prompt = `Analyze the following GraphQL response and summarize the key data:\n\n${JSON.stringify(raw, null, 2)}\n\nQuery: ${query}`;
  const processed = await proxyThroughLlama(prompt, options);

  return { raw, processed };
}
