# MSW v2 to v3 Migration Guide

MSW 3.0.0 was released on 2026-09-28 (latest: 3.0.3). It is a major, breaking release: ESM-only, with new minimum Node.js and TypeScript versions, renamed APIs, and new interception features.

## Requirements

| Requirement | v2 | v3 |
|-------------|----|----|
| Module format | CJS + ESM | **ESM only** |
| Node.js | v14+ | **v22+** (v24 and v26 also supported) |
| TypeScript | v4.4+ | **v5.9+** (v6.0 and v7.0 also supported) |

If your project still needs CommonJS, Node.js <22, or TypeScript <5.9, stay on `msw@2` (`^2.15.0`) until you can upgrade the toolchain.

## Breaking API changes

### `msw/native` removed

The `msw/native` entrypoint no longer exists. React Native support moved to a separate package:

```typescript
// v2
import { setupServer } from 'msw/native'

// v3
import { setupServer } from '@msw/react-native'
```

### GraphQL moved to `msw/graphql`

`graphql` is now an optional peer dependency and is imported from its own entrypoint:

```typescript
// v2
import { graphql } from 'msw'

// v3
import { graphql } from 'msw/graphql'
```

GraphQL v17 and GraphQL subscriptions are supported. The `GraphQLLinkHandlers` type was renamed to `GraphQLLink`.

### `handleRequest()` removed

The low-level `handleRequest()` utility was removed. Use `defineNetwork()` instead:

```typescript
// v3
import { defineNetwork } from 'msw'
```

### Option and event renames

| v2 name | v3 name |
|---------|---------|
| `onUnhandledRequest` option | `onUnhandledFrame` |
| `connection` lifecycle event | `websocket:connection` |
| `GraphQLLinkHandlers` type | `GraphQLLink` |

New in v3: a `websocket:error` lifecycle event for connection errors.

### `worker.stop()` returns a Promise

```typescript
// v3 — awaiting matters only for in-flight critical scenarios
await worker.stop()
```

### Fake timers no longer patched

MSW no longer patches `setTimeout` to circumvent fake timers in test runners. Advance fake timers normally for delayed mocked responses to resolve.

### Cookie behavior in Node.js

Cookies are no longer managed in Node.js; your environment's default behavior applies (no effect in the browser). `request.headers.get('cookie')` in handlers returns `null` in all environments — use the `cookies` resolver argument for cookie-based logic.

### Other changes

- `file://` requests now throw in Node.js (unsupported by `fetch`).
- HTTP-to-WebSocket upgrade requests performed via `fetch()` now throw in Node.js.
- `bypass()` now removes the `Content-Length` request header.

## New in v3

- **`msw/utils` entrypoint** — import individual utilities (`delay`, `passthrough`) with a smaller bundle footprint.
- **Vite plugin** for MSW.
- **Page navigation and form submission interception.**
- **WebSocket Extension API** for custom experiences.
- **Passthrough request-header modification.**
- **GraphQL v17 and GraphQL subscriptions.**

## Migration checklist

1. Confirm your runtime: ESM-only project, Node.js >=22, TypeScript >=5.9.
2. Update imports: `graphql` from `msw/graphql`; React Native from `@msw/react-native`.
3. Rename `onUnhandledRequest` to `onUnhandledFrame` everywhere (tests, setup files).
4. Rename the WebSocket `connection` listener to `websocket:connection`.
5. Replace any `handleRequest()` usage with `defineNetwork()`.
6. Replace cookie header reads in handlers with the `cookies` resolver argument.
7. `await worker.stop()` where shutdown ordering matters.
8. If you relied on MSW handling fake timers, advance them explicitly in tests.
9. For smaller bundles, move utility imports to `msw/utils`.
