// Names the examples use without declaring them. Each one has a real type taken from the package that
// provides it, or a type that fits every place the examples use it; none is `any`. A block that declares or
// imports the name itself shadows the declaration here.
//
// The examples run under Vitest with globals enabled and @testing-library/jest-dom matchers, as
// references/test-patterns.md sets up.
/// <reference types="vitest/globals" />
import "@testing-library/jest-dom/vitest";
import type { BoundFunctions, queries } from "@testing-library/dom";
import type { DocumentNode } from "graphql";
import type { RequestHandler } from "msw";
import type { WebSocketNetworkFrameEventMap } from "msw/experimental";
import type { ReactNode } from "react";

interface Post {
  id: number;
  title: string;
}

declare global {
  // MSW, imported in the examples from the v3 subpaths
  const http: typeof import("msw/http").http;
  const HttpResponse: typeof import("msw/http").HttpResponse;
  const graphql: typeof import("msw/graphql").graphql;
  const delay: typeof import("msw/utils/delay").delay;
  const setupServer: typeof import("msw/node").setupServer;

  // The project's own MSW setup
  const server: ReturnType<typeof import("msw/node").setupServer>;
  const worker: ReturnType<typeof import("msw/browser").setupWorker>;
  const handlers: RequestHandler[];
  // A resolver that the examples pass to both http and GraphQL handlers. One that returns nothing fits
  // both: MSW then moves on to the next matching handler.
  function resolver(): void;
  function listener(event: WebSocketNetworkFrameEventMap["websocket:connection"]): void;
  const GetUserDocument: DocumentNode;
  const allPosts: Post[];
  const request: Request;
  const readableStream: ReadableStream<Uint8Array>;

  // Testing Library. The DOM library already declares a global `screen` (window.screen), and a second
  // global declaration cannot replace it. The check merges the Testing Library queries into the DOM
  // `Screen` interface instead, so that `screen.getByText()` in an example has its real type. This merge
  // exists only in the check: in a test file, import `screen` from @testing-library/react.
  interface Screen extends BoundFunctions<typeof queries> {}
  const render: typeof import("@testing-library/react").render;
  const waitFor: typeof import("@testing-library/react").waitFor;
  const userEvent: typeof import("@testing-library/user-event").default;

  // React
  const ReactDOM: typeof import("react-dom/client");
  function App(): ReactNode;
  function UserProfile(): ReactNode;
  function DataLoader(): ReactNode;
  function LoginForm(): ReactNode;
  function PostList(): ReactNode;
}
export {};
