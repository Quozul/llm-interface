import { useState } from "react";

export interface Params {
  stream: boolean;
  n_predict: number;
  temperature: number;
  stop: string[];
  repeat_last_n: number;
  repeat_penalty: number;
  top_k: number;
  top_p: number;
  tfs_z: number;
  typical_p: number;
  presence_penalty: number;
  frequency_penalty: number;
  mirostat: number;
  mirostat_tau: number;
  mirostat_eta: number;
  grammar: string;
  n_probs: number;
  prompt: string;
}

export const DEFAULT_PARAMS: Params = {
  stream: true,
  n_predict: 400,
  temperature: 0.7,
  stop: ["</s>"],
  repeat_last_n: 256,
  repeat_penalty: 1.18,
  top_k: 40,
  top_p: 0.5,
  tfs_z: 1,
  typical_p: 1,
  presence_penalty: 0,
  frequency_penalty: 0,
  mirostat: 2,
  mirostat_tau: 5,
  mirostat_eta: 0.1,
  grammar: "",
  n_probs: 0,
  prompt: "",
};

export default function useCompletion() {
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS);

  async function complete(
    llamaEndpoint: string,
    systemPrompt: string,
    chatbotName: string,
    promptTemplate: string,
    stop: string[],
    signal: AbortSignal,
    history: string,
    callback: (content: string) => void,
  ) {
    let fullContent = "";

    const body: Params = {
      ...DEFAULT_PARAMS,
      stop,
      prompt: promptTemplate
        .replace("{{prompt}}", systemPrompt)
        .replace("{{history}}", history)
        .replace("{{char}}", chatbotName),
    };

    const response = await fetch(`${llamaEndpoint}/completion`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
      },
      signal,
    });

    if (response.body === null) {
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      try {
        if (signal.aborted) break;

        const { done, value } = await reader.read();
        const decoded = decoder.decode(value);
        const cleaned = decoded.replace("data: ", "").trim();
        const { content, stop } = JSON.parse(cleaned);

        if (stop || done) break;

        fullContent += content;
        callback(fullContent.trim());
      } catch (e) {
        console.log(e);
        break;
      }
    }
  }

  return { complete };
}
