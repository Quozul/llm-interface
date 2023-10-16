import { createRef, useCallback, useContext, useEffect, useState } from "react";
import Markdown from "react-markdown";
import CodeBlock from "./CodeBlock.tsx";
import "bootstrap-icons/font/bootstrap-icons.css";
import ContextMenu from "./ContextMenu.tsx";
import "./style.css";
import TextArea from "./TextArea.tsx";
import { SettingsContext } from "./SettingsContext.tsx";
import useCompletion from "./useCompletion.ts";
import useClickOutside from "./useClickOutside.ts";

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
  const clickOutsideRef = createRef<HTMLDivElement>();
  useClickOutside(clickOutsideRef, () => {
    setContextMenuMessage(null);
  });
  const {
    systemPrompt,
    chatbotName,
    userName,
    promptTemplate,
    chatHistoryTemplate,
    llamaEndpoint,
    stop,
  } = useContext(SettingsContext);
  const { complete } = useCompletion();

  const handleSubmit = async (value: string) => {
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

    await complete(
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

  const getFocus = useCallback(
    (event: KeyboardEvent) => {
      if (event.target === document.body) {
        ref.current?.focus();
      }
    },
    [ref],
  );

  useEffect(() => {
    document.addEventListener("keypress", getFocus);

    return () => {
      document.removeEventListener("keypress", getFocus);
    };
  }, [getFocus]);

  return (
    <div className="flex-col overflow-hidden">
      <div className="flex-col-reverse grow p-1 overflow-auto position-relative">
        {[...messages].reverse().map((message, index) => {
          const { content, author } = message;

          return (
            <div
              className={`rounded-3 bg-gray-200 p-3 ${
                author === userName
                  ? "rounded-bottom-right-0 m-left-2"
                  : "rounded-bottom-left-0 m-right-2"
              }`}
              onContextMenu={(event) => {
                event.preventDefault();
                setContextMenuMessage(message);
              }}
              key={index}
            >
              <Markdown components={{ code: CodeBlock }}>{content}</Markdown>
            </div>
          );
        })}

        {contextMenuMessage && (
          <ContextMenu
            contextRef={clickOutsideRef}
            message={contextMenuMessage}
            close={() => {
              setContextMenuMessage(null);
            }}
          />
        )}
      </div>

      <div className="flex-col gap-2 p-1">
        <div className="flex">
          <button
            onClick={() => {
              setMessages([]);
            }}
            className="danger"
          >
            Clear
          </button>

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

          {!isLoading && messages.length > 1 && (
            <button
              onClick={async () => {
                messages.pop();
                setMessages(messages);
                const lastMessage = messages.pop();
                if (lastMessage) {
                  await handleSubmit(lastMessage.content);
                }
              }}
            >
              Regenerate
            </button>
          )}
        </div>

        <form
          className="flex"
          onSubmit={async (event) => {
            event.preventDefault();

            if (!isLoading) {
              await handleSubmit(value);
            }
          }}
        >
          <TextArea
            className="w-100"
            onKeyDown={async (event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (value.trim().length > 0) {
                  await handleSubmit(value);
                }
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
      </div>
    </div>
  );
};

export default Assistant;
