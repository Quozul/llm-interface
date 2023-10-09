import styled from "@emotion/styled";
import { createRef, useCallback, useEffect, useState } from "react";
import { css } from "@emotion/react";
import AutoLayout from "./AutoLayout.tsx";
import Markdown from "react-markdown";
import CodeBlock from "./CodeBlock.tsx";
import "bootstrap-icons/font/bootstrap-icons.css";
import ContextMenu from "./ContextMenu.tsx";

// ChatML format: https://github.com/openai/openai-python/blob/main/chatml.md

const chatbotName = "Mistral";
const userName = "User";

const SYSTEM_PROMPT = `<|im_start|>system
You are ${chatbotName}, a large language model trained by MistralAI. Answer as concisely as possible in the User's language. If the user asks for a game, play with them. Markdown format allowed.<|im_end|>`;

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

  if (response.body === null) {
    return;
  }

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

export type MessageData = { content: string; author: string };

const Assistant = () => {
  const [value, setValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [contextMenuMessage, setContextMenuMessage] =
    useState<MessageData | null>(null);
  const ref = createRef<HTMLInputElement>();

  const handleSubmit = async (content: string) => {
    const newMessages: MessageData[] = [
      ...messages,
      { content, author: userName },
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

  const getFocus = useCallback(() => {
    ref.current?.focus();
  }, [ref]);

  useEffect(() => {
    document.addEventListener("keypress", getFocus);

    return () => {
      document.removeEventListener("keypress", getFocus);
    };
  }, [getFocus]);

  return (
    <Open>
      <Messages>
        {[...messages].reverse().map((message) => {
          const { content, author } = message;

          return (
            <Bubble
              side={author === userName ? "right" : "left"}
              onContextMenu={(event) => {
                event.preventDefault();
                setContextMenuMessage(message);
              }}
            >
              <Copy
                onClick={async () => {
                  await navigator.clipboard.writeText(content);
                }}
              >
                <i className="bi-clipboard"></i>
              </Copy>

              <Markdown components={{ code: CodeBlock }}>{content}</Markdown>
            </Bubble>
          );
        })}
      </Messages>

      <Inner>
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

              <QuickQuestion
                onClick={async () => {
                  await handleSubmit(
                    "Write a python code to split a file on line breaks and explain it.",
                  );
                }}
                disabled={isLoading}
              >
                Split file
              </QuickQuestion>
            </AutoLayout>

            <AutoLayout gap={10}>
              {isLoading && abortController !== null && (
                <QuickQuestion
                  onClick={() => {
                    abortController.abort();
                  }}
                  background="#f38ba8"
                >
                  Stop
                </QuickQuestion>
              )}

              <QuickQuestion
                onClick={() => {
                  setMessages([]);
                }}
                background="#f38ba8"
              >
                Clear
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
              setValue(currentTarget.value);
            }}
            ref={ref}
            type="text"
            value={value}
            autoComplete="off"
            name="question"
            placeholder={`Ask something to ${chatbotName}…`}
          />

          <Button disabled={isLoading}>
            <i className="bi-send" />
            Send
          </Button>
        </Form>

        {contextMenuMessage && <ContextMenu message={contextMenuMessage} />}
      </Inner>
    </Open>
  );
};

export default Assistant;

const Open = styled.div`
  display: flex;
  flex-direction: column;
  margin: auto;
  width: 100%;
  max-width: 640px;
  flex-grow: 1;
  height: 100%;
  background-color: #1e1e2e;
`;

const Inner = styled.div`
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Messages = styled(Inner)`
  flex-grow: 1;
  flex-direction: column-reverse;
  overflow-y: auto;
`;

const Commands = styled.div`
  width: 100%;
  bottom: 10px;
`;

const Bubble = styled.div<{ side: "left" | "right" }>`
  position: relative;
  border-radius: 25px;
  padding: 0 16px;
  ${({ side }) =>
    side === "left"
      ? css`
          border-bottom-left-radius: 0;
          background: #313244;
          color: #cdd6f4;
          margin-right: 20px;
        `
      : css`
          border-bottom-right-radius: 0;
          background: #89b4fa;
          color: #1e1e2e;
          margin-left: 20px;
        `};
`;

const Copy = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  aspect-ratio: 1/1;
  border: none;
  font-size: 0.75rem;
  border-radius: 5px;
  cursor: pointer;
`;

const Input = styled.input`
  width: 100%;
  display: inline-flex;
  font-weight: var(--font-weight-medium);
  font-size: 1rem;
  padding: 10px;
  background-color: #181925;
  color: white;
  cursor: text;
  border: none;
  gap: 10px;
  border-radius: 10px;
  justify-content: center;
  word-break: break-word;
  resize: none;

  &:focus-visible {
    outline: none;
  }

  &::placeholder {
    color: #75757e;
  }
`;

const Form = styled.form`
  display: flex;
  gap: 10px;
`;

const Button = styled.button`
  background-color: #f9e2af;
  border: none;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  gap: 10px;
  align-items: center;
`;

const QuickQuestion = styled(Button)<{ background?: string }>`
  background: ${({ background = "#89b4fa" }) => background};
`;
