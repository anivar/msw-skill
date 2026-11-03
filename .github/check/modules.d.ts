// Packages the check does not install. Each declaration copies the published signatures of the version
// named, with the types of uninstalled packages replaced by the parts the examples use.

// msw-storybook-addon 3.0.3 (build/index.d.mts, build/csf3.d.mts). Its types import Storybook, which the
// check does not install. LoaderFunction stands in for Storybook's LoaderFunction<Renderer>.
declare module "msw-storybook-addon" {
  import type { SetupWorker } from "msw/browser";
  export type MswApi = SetupWorker;
  type SetupFunction = () => MswApi | Promise<MswApi>;
  export default function addonMsw(setup?: SetupFunction): object;
}

declare module "msw-storybook-addon/csf3" {
  import type { SetupWorker } from "msw/browser";
  type SetupFunction = () => SetupWorker | Promise<SetupWorker>;
  type LoaderFunction = (context: object) => unknown;
  export function mswLoader(setup?: SetupFunction): LoaderFunction;
}
