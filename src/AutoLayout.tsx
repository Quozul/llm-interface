
import styled from "@emotion/styled";

/**
 * Represents a styled div component with flexible layout properties.
 * @param {Object} props - The properties of the AutoLayout component.
 * @param {string} [props.align="flex-start"] - The vertical alignment of child elements.
 * @param {string} [props.direction="row"] - The direction in which child elements should be laid out.
 * @param {number} [props.gap=0] - The gap between child elements.
 * @param {string} [props.justify="flex-start"] - The horizontal alignment of child elements.
 * @param {boolean} [props.wrap=false] - Determines whether child elements should wrap to the next line.
 * @returns {React.Component} - The AutoLayout component.
 *
 * @example
 * <AutoLayout gap={10} direction="column" justify="center" align="flex-end" wrap>
 *   <div>Child 1</div>
 *   <div>Child 2</div>
 *   <div>Child 3</div>
 * </AutoLayout>
 */
const AutoLayout = styled.div<{
    align?: "flex-start" | "center" | "flex-end" | "stretch";
    direction?: "column" | "row";
    gap?: number;
    justify?: "flex-start" | "center" | "space-between" | "flex-end" | "space-around" | "space-evenly" | "stretch";
    wrap?: boolean;
}>`
  align-items: ${({ align = "flex-start" }) => align};
  display: flex;
  flex-direction: ${({ direction = "row" }) => direction};
  flex-wrap: ${({ wrap = false }) => (wrap ? "wrap" : "nowrap")};
  gap: ${({ gap = 0 }) => gap}px;
  justify-content: ${({ justify = "start" }) => justify};
`;

export default AutoLayout;
