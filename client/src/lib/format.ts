export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "待发布";
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}
