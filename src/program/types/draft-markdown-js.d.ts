declare module 'markdown-draft-js' {
  export function draftToMarkdown(object: unknown): string;
  export function markdownToDraft(markdown: string): object;
}
