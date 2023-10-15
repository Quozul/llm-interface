import { HTMLProps, RefObject } from "react";

type Props = {
  textAreaRef?: RefObject<HTMLTextAreaElement>;
} & HTMLProps<HTMLTextAreaElement>;

export default function TextArea({
  onInput,
  className,
  textAreaRef,
  ...props
}: Props) {
  return (
    <textarea
      onInput={(event) => {
        event.currentTarget.style.height = "";
        event.currentTarget.style.height =
          event.currentTarget.scrollHeight - 16 + "px";
        onInput?.(event);
      }}
      className={`overflow-hidden ${className}`}
      ref={textAreaRef}
      {...props}
    />
  );
}
