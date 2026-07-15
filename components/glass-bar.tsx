/**
 * The glass primitive. Fixed position, fixed size, so backdrop-filter repaints a
 * small rect and never a scrolling list. It refracts the cover wall behind it,
 * which is the whole point of the material: glass needs something worth floating
 * over. Never wrap scrolling content in this. See docs/design.md.
 */
export function GlassBar({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "aside" | "nav" | "header";
}) {
  return <Tag className={`glass ${className}`}>{children}</Tag>;
}
