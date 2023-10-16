import { MessageData } from "./Chat.tsx";
import { RefObject } from "react";

type Props = {
  message: MessageData;
  contextRef: RefObject<HTMLDivElement>;
  close: () => void;
};

export default function ContextMenu({ message, contextRef, close }: Props) {
  return (
    <div
      ref={contextRef}
      className="position-absolute bottom-2 left-2 right-2 list-group"
    >
      <div className="list-entry">
        {message.author}: {message.content}
      </div>

      <div
        className="list-entry hover:bg-gray-200 cursor-pointer flex"
        onClick={async () => {
          await navigator.clipboard.writeText(message.content);
          close();
        }}
      >
        <i className="bi-clipboard" />
        Copy content
      </div>
    </div>
  );
}
