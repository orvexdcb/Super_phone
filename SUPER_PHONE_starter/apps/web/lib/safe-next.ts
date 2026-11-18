// يمنع إعادة التوجيه إلى مواقع خارجية
export function safeNext(next: string | null | undefined): string {
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")) return next;
  return "/";
}
