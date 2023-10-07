import styled from "@emotion/styled";
import { createRef, useState } from "react";
import { css } from "@emotion/react";
import AutoLayout from "./AutoLayout.tsx";

// ChatML format: https://github.com/openai/openai-python/blob/main/chatml.md

const chatbotName = "ChatGPT";

const SYSTEM_PROMPT = `<|im_start|>system
You are ${chatbotName}, a large language model trained by OpenAI. Answer as concisely as possible.<|im_end|>`;

async function queryLlama(
  signal: AbortSignal,
  history: string,
  callback: (content: string) => void,
) {
  let fullContent = "";
  const body = {
    stream: true,
    n_predict: 400,
    temperature: 0.7,
    stop: ["</s>", "<|im_start|>", "<|im_end|>"],
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
    prompt: `${SYSTEM_PROMPT}.
${history}
<|im_start|>${chatbotName}
`,
  };

  const response = await fetch("http://localhost:8080/completion", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
    signal,
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    try {
      const { done, value } = await reader.read();
      const decoded = decoder.decode(value);
      const cleaned = decoded.split("\n")[0].replace("data: ", "").trim();
      const { content, stop } = JSON.parse(cleaned);
      if (stop || done) {
        break;
      }
      fullContent += content;
      callback(fullContent);
    } catch (e) {
      break;
    }
  }
}

type MessageData = { content: string; author: "User" | "ChatGPT" };

const Assistant = () => {
  const [value, setValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const ref = createRef<HTMLDivElement>();

  const handleSubmit = async (content: string) => {
    const newMessages: MessageData[] = [
      ...messages,
      { content, author: "User" },
    ];
    setMessages(newMessages);

    setIsLoading(true);

    const history = newMessages
      .map(
        ({ content, author }) => `<|im_start|>${author}\n${content}<|im_end|>`,
      )
      .join("\n");

    const controller = new AbortController();
    setAbortController(controller);

    await queryLlama(controller.signal, history, (content: string) => {
      setMessages([...newMessages, { content, author: chatbotName }]);
    });

    setIsLoading(false);
  };

  return (
    <Open>
      <Main>
        <Messages ref={ref}>
          {[...messages].reverse().map(({ content, author }) => (
            <Bubble side={author === "User" ? "right" : "left"}>
              {content.split("\n").map((line) => (
                <span>{line}</span>
              ))}
            </Bubble>
          ))}
        </Messages>

        <Commands>
          <AutoLayout gap={10} justify="space-between">
            <AutoLayout gap={10}>
              <QuickQuestion
                onClick={async () => {
                  await handleSubmit("Who are you?");
                }}
                disabled={isLoading}
              >
                Who are you?
              </QuickQuestion>
            </AutoLayout>

            <AutoLayout gap={10}>
              {isLoading && abortController !== null && (
                <QuickQuestion
                  onClick={() => {
                    abortController.abort();
                  }}
                  background="red"
                >
                  Stop
                </QuickQuestion>
              )}

              <QuickQuestion
                onClick={() => {
                  setMessages([]);
                }}
                background="red"
              >
                Effacer
              </QuickQuestion>
            </AutoLayout>
          </AutoLayout>
        </Commands>

        <Form
          onSubmit={async (event) => {
            event.preventDefault();

            if (!isLoading) {
              setValue("");
              await handleSubmit(value);
            }
          }}
        >
          <Input
            onInput={({ currentTarget }) => {
              currentTarget.style.height = `${Math.min(
                20 * 5,
                currentTarget.scrollHeight,
              )}px`;
              setValue(currentTarget.value);
            }}
            type="text"
            value={value}
            autoComplete="off"
            name="question"
            placeholder={`Ask something to ${chatbotName}…`}
          />

          <button disabled={isLoading}>Envoyer</button>
        </Form>
      </Main>
    </Open>
  );
};

export default Assistant;

const Open = styled.div`
  background-color: var(--color-neutral-100);
  border-radius: 10px;
  view-transition-name: neo-assistant;
  display: flex;
  margin: auto;
  flex-direction: column;
  gap: 20px;
  width: 530px;
  height: 100vh;
`;

const Main = styled.main`
  display: flex;
  gap: 20px;
  flex-direction: column;
  height: 100%;
  padding: 20px;
`;

const Messages = styled(Main)`
  flex-direction: column-reverse;
  flex-grow: 1;
  overflow-y: auto;
  padding: 0;
`;

const Commands = styled.div`
  width: 100%;
  bottom: 10px;
`;

const Bubble = styled.div<{ side: "left" | "right" }>`
  border-radius: 10px;
  padding: 10px;
  ${({ side }) =>
    side === "left"
      ? css`
          border-bottom-left-radius: 0;
          background-color: lightblue;
          margin-right: 20px;
        `
      : css`
          border-bottom-right-radius: 0;
          background-color: lightgreen;
          margin-left: 20px;
        `};
  white-space: pre-line;
`;

const Input = styled.input`
  width: 100%;
  display: inline-flex;
  font-weight: var(--font-weight-medium);
  font-size: 1rem;
  line-height: 22px;
  padding: 0;
  background-color: var(--color-neutral-100);
  color: var(--color-neutral-700);
  border: 1px solid var(--color-neutral-700);
  cursor: text;
  gap: 10px;
  border-radius: 5px;
  justify-content: center;
  word-break: break-word;
  resize: none;

  &:focus-visible {
    outline: none;
  }
`;

const Form = styled.form`
  display: flex;
  gap: 10px;
`;

const QuickQuestion = styled.button<{ background?: string }>`
  background-color: ${({ background }) => background || "black"};
  color: white;
  padding: 10px;
  border-radius: 100px;
  border: none;
  cursor: pointer;
  font-size: 1rem;
`;
