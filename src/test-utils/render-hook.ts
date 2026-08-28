import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ensureDomEnvironment } from "./dom-env";

ensureDomEnvironment();

export type RenderHookResult<Result, Props = void> = {
  result: { current: Result };
  rerender: (newProps?: Props) => Promise<void>;
  unmount: () => Promise<void>;
};

export async function renderHook<Result, Props = void>(
  useHook: (props: Props) => Result,
  options?: { initialProps?: Props },
): Promise<RenderHookResult<Result, Props>> {
  ensureDomEnvironment();

  const container = document.createElement("div");
  const root: Root = createRoot(container as unknown as Element);

  let currentProps = options?.initialProps as Props;
  const result = {} as { current: Result };

  function TestComponent({ props }: { props: Props }) {
    result.current = useHook(props);
    return null;
  }

  await act(async () => {
    root.render(React.createElement(TestComponent, { props: currentProps }));
  });

  return {
    result,
    async rerender(newProps?: Props) {
      if (newProps !== undefined) {
        currentProps = newProps;
      }
      await act(async () => {
        root.render(React.createElement(TestComponent, { props: currentProps }));
      });
    },
    async unmount() {
      await act(async () => {
        root.unmount();
      });
    },
  };
}
