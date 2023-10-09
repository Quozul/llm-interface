import SyntaxHighlighter from "react-syntax-highlighter";
import { PropsWithChildren } from "react";
import { dark } from "react-syntax-highlighter/dist/esm/styles/hljs";

type Props = {
  className?: string;
  node?: unknown;
};

function CodeBlock({
  children,
  className,
  node,
  ...rest
}: PropsWithChildren<Props>) {
  const match = /language-(\w+)/.exec(className || "");

  return match ? (
    <SyntaxHighlighter
      {...rest}
      children={String(children).replace(/\n$/, "")}
      style={dark}
      language={match[1]}
      PreTag="div"
    />
  ) : (
    <code {...rest} className={className}>
      {children}
    </code>
  );
}

export default CodeBlock;
