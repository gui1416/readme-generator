declare module "react-syntax-highlighter" {
 import * as React from "react";
 export interface SyntaxHighlighterProps {
  language?: string;
  style?: Record<string, unknown>;
  PreTag?: React.ElementType;
  className?: string;
  children?: React.ReactNode;
  [key: string]: unknown;
 }
 export class Prism extends React.Component<SyntaxHighlighterProps> { }
 export class Light extends React.Component<SyntaxHighlighterProps> { }
 export function registerLanguage(lang: string, def: object): void;
}

declare module "react-syntax-highlighter/dist/esm/styles/prism" {
 export const oneLight: Record<string, unknown>;
}
