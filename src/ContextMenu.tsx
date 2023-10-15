import { MessageData } from "./Chat.tsx";
import styled from "@emotion/styled";

type Props = {
  message: MessageData;
};

function ContextMenu({ message }: Props) {
  return <Container>{message.author}</Container>;
}

export default ContextMenu;

const Container = styled.div`
  display: flex;
  position: absolute;
  bottom: 30px;
  background-color: white;
  padding: 10px;
  width: 100%;
  max-width: 640px;
`;
