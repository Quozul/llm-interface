import { createRef, useCallback, useContext, useEffect, useState } from "react";
import Markdown from "react-markdown";
import CodeBlock from "./CodeBlock.tsx";
import "bootstrap-icons/font/bootstrap-icons.css";
import ContextMenu from "./ContextMenu.tsx";
import "./style.css";
import TextArea from "./TextArea.tsx";
import { SettingsContext } from "./SettingsContext.tsx";
import useCompletion from "./chat/useCompletion.ts";
import useClickOutside from "./useClickOutside.ts";
import useHistory from "./chat/useHistory.ts";

import { speak, useCurrentVoice } from "./Speak.tsx";

export type MessageData = { content: string; author: string };

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "numeric",
  hour12: false,
});

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function formatTimeOrDate(date: Date) {
  const today = new Date();

  if (new Date(date).getDate() === today.getDate()) {
    return "Today at " + timeFormatter.format(date);
  } else {
    return dateFormatter.format(date);
  }
}

const Assistant = () => {
  const [value, setValue] = useState<string>("");
  const [contextMenuMessage, setContextMenuMessage] =
    useState<MessageData | null>(null);
  const ref = createRef<HTMLTextAreaElement>();
  const clickOutsideRef = createRef<HTMLDivElement>();
  useClickOutside(clickOutsideRef, () => {
    setContextMenuMessage(null);
  });
  const { chatbotName, userName } = useContext(SettingsContext);
  const completion = useCompletion();
  const history = useHistory(completion.latestContent);
  const selectedVoice = useCurrentVoice();

  const handleSubmit = async (value: string) => {
    const content = value.trim();
    setValue("");

    if (content.length === 0) {
      return;
    }

    const formattedHistory = history.addToHistory(userName, content);

    try {
      const { content: generatedContent, error } =
        await completion.complete(formattedHistory);

      if (generatedContent !== null) {
        history.addToHistory(chatbotName, generatedContent, error);

        if (selectedVoice !== null) {
          speak(generatedContent, selectedVoice);
        }
      }
    } catch (e) {
      console.error(e);
      history.addToHistory("System", "", true);
    }
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
      <div className="position-relative grow flex-col overflow-hidden">
        <div className="flex-col-reverse p-1 overflow-auto gap-2">
          {history.completeHistory.map((message, index) => {
            const {
              message: content,
              name: author,
              error,
              timestamp,
            } = message;

            return (
              <div
                className={`whitespace-break-spaces flex-col ${
                  author === userName ? "align-flex-end" : "align-flex-start"
                }`}
              >
                {author !== userName && (
                  <div>
                    {author} ·{" "}
                    <span className="text-muted">
                      {formatTimeOrDate(timestamp)}
                    </span>
                  </div>
                )}
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
                  {!content && error ? (
                    <span className="text-danger">
                      An error has occurred while generating the response.
                    </span>
                  ) : (
                    <Markdown components={{ code: CodeBlock }}>
                      {content}
                    </Markdown>
                  )}
                </div>
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
      </div>

      <div className="flex-col gap-2 p-1">
        <div className="flex">
          {history.completeHistory.length > 0 && (
            <button
              onClick={() => {
                history.clearHistory();
                completion.reset();
              }}
              className="danger"
            >
              Clear
            </button>
          )}

          {completion.isLoading && (
            <button
              onClick={() => {
                completion.abort();
              }}
              className="danger"
            >
              Stop
            </button>
          )}

          {/*completion.isLoading && history.completeHistory.length > 1 && (
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
          )*/}
        </div>

        <form
          className="flex"
          onSubmit={async (event) => {
            event.preventDefault();

            if (!completion.isLoading) {
              await handleSubmit(value);
            }
          }}
        >
          <TextArea
            className="w-100"
            onKeyDown={async (event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();

                if (value.trim().length > 0 && !completion.isLoading) {
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

          <button
            className="primary flex align-center"
            disabled={value.trim().length === 0 || completion.isLoading}
          >
            <i className="bi-send" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Assistant;
