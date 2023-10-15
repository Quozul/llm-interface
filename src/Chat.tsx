import styled from "@emotion/styled";
import { createRef, useCallback, useContext, useEffect, useState } from "react";
import Markdown from "react-markdown";
import CodeBlock from "./CodeBlock.tsx";
import "bootstrap-icons/font/bootstrap-icons.css";
import ContextMenu from "./ContextMenu.tsx";
import "./style.css";
import TextArea from "./TextArea.tsx";
import { SettingsContext } from "./SettingsContext.tsx";

// ChatML format: https://github.com/openai/openai-python/blob/main/chatml.md

async function queryLlama(
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
  const body = {
    stream: true,
    n_predict: 400,
    temperature: 0.7,
    stop,
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
      const { done, value } = await reader.read();
      const decoded = decoder.decode(value);
      const cleaned = decoded.split("\n")[0].replace("data: ", "").trim();
      const { content, stop } = JSON.parse(cleaned);
      if (stop || done) {
        break;
      }
      fullContent += content;
      callback(fullContent.trim());
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
  const ref = createRef<HTMLTextAreaElement>();
  const {
    systemPrompt,
    chatbotName,
    userName,
    promptTemplate,
    chatHistoryTemplate,
    llamaEndpoint,
    stop,
  } = useContext(SettingsContext);

  const handleSubmit = async () => {
    const content = value.trim();
    setValue("");

    if (content.length === 0) {
      return;
    }

    const newMessages: MessageData[] = [
      ...messages,
      { content, author: userName },
    ];
    setMessages(newMessages);

    setIsLoading(true);

    const history = newMessages
      .map(({ content, author }) =>
        chatHistoryTemplate
          .replace("{{name}}", author)
          .replace("{{message}}", content),
      )
      .join("\n");

    const controller = new AbortController();
    setAbortController(controller);

    await queryLlama(
      llamaEndpoint,
      systemPrompt,
      chatbotName,
      promptTemplate,
      stop,
      controller.signal,
      history,
      (content: string) => {
        setMessages([...newMessages, { content, author: chatbotName }]);
      },
    );

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
    <div className="flex-col overflow-hidden">
      <div className="flex-col-reverse grow p-1 overflow-auto">
        {[...messages].reverse().map((message) => {
          const { content, author } = message;

          return (
            <div
              className={`rounded-3 bg-gray-200 position-relative p-3 ${
                author === userName
                  ? "rounded-bottom-right-0 m-left-2"
                  : "rounded-bottom-left-0 m-right-2"
              }`}
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
            </div>
          );
        })}
      </div>

      <div className="flex-col gap-2 p-1">
        <div className="flex">
          {isLoading && abortController !== null && (
            <button
              onClick={() => {
                abortController.abort();
              }}
              className="danger"
            >
              Stop
            </button>
          )}

          <button
            onClick={() => {
              setMessages([]);
            }}
            className="danger"
          >
            Clear
          </button>
        </div>

        <form
          className="flex"
          onSubmit={async (event) => {
            event.preventDefault();

            if (!isLoading) {
              await handleSubmit();
            }
          }}
        >
          <TextArea
            className="w-100"
            onKeyDown={async (event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                await handleSubmit();
                event.target.style.height = "";
                event.target.style.height =
                  event.target.scrollHeight - 16 + "px";
              }
            }}
            onInput={({ currentTarget }) => {
              setValue(currentTarget.value);
            }}
            textAreaRef={ref}
            value={value}
            autoComplete="off"
            name="question"
            placeholder={`Ask something to ${chatbotName}…`}
          />

          <button className="primary flex align-center" disabled={isLoading}>
            <i className="bi-send" />
            Send
          </button>
        </form>

        {contextMenuMessage && <ContextMenu message={contextMenuMessage} />}
      </div>
    </div>
  );
};

export default Assistant;

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
