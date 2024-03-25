export type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

export function hasBody(method: Method): boolean {
  return method !== "GET" && method !== "HEAD";
}
