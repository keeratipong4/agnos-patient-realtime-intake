// Minimal DOM environment for React 19 testing in Vitest Node environment

type MockEventListener = (...args: unknown[]) => void;

interface MockNodeInterface {
  nodeType: number;
  ownerDocument: unknown;
}

interface MockElementInterface extends MockNodeInterface {
  tagName: string;
  childNodes: MockNodeInterface[];
  style: Record<string, unknown>;
  setAttribute: (name: string, value: string) => void;
  getAttribute: (name: string) => string | null;
  removeAttribute: (name: string) => void;
  appendChild: <T extends MockNodeInterface>(child: T) => T;
  removeChild: <T extends MockNodeInterface>(child: T) => T;
  insertBefore: <T extends MockNodeInterface>(newChild: T, refChild: MockNodeInterface | null) => T;
  addEventListener: (event: string, fn: MockEventListener) => void;
  removeEventListener: (event: string, fn: MockEventListener) => void;
}

export function ensureDomEnvironment(): void {
  if (typeof globalThis.document !== "undefined") {
    return;
  }

  class MockNode implements MockNodeInterface {
    static ELEMENT_NODE = 1;
    static TEXT_NODE = 3;
    static COMMENT_NODE = 8;
    nodeType = 1;
    ownerDocument: unknown = null;
  }

  class MockElement extends MockNode {}
  class MockHTMLElement extends MockElement {}
  class MockHTMLIFrameElement extends MockHTMLElement {}
  class MockHTMLDocument {}
  class MockDocument {}

  const listeners: Record<string, MockEventListener[]> = {};

  const doc = {
    nodeType: 9,
    createElement(tag: string): MockElementInterface {
      const element: MockElementInterface = {
        nodeType: 1,
        tagName: tag.toUpperCase(),
        childNodes: [],
        ownerDocument: doc,
        style: {},
        setAttribute() {},
        getAttribute() {
          return null;
        },
        removeAttribute() {},
        appendChild<T extends MockNodeInterface>(child: T): T {
          this.childNodes.push(child);
          return child;
        },
        removeChild<T extends MockNodeInterface>(child: T): T {
          const idx = this.childNodes.indexOf(child);
          if (idx >= 0) {
            this.childNodes.splice(idx, 1);
          }
          return child;
        },
        insertBefore<T extends MockNodeInterface>(
          newChild: T,
          refChild: MockNodeInterface | null,
        ): T {
          const idx = refChild ? this.childNodes.indexOf(refChild) : -1;
          if (idx >= 0) {
            this.childNodes.splice(idx, 0, newChild);
          } else {
            this.childNodes.push(newChild);
          }
          return newChild;
        },
        addEventListener(event: string, fn: MockEventListener) {
          listeners[event] ??= [];
          listeners[event].push(fn);
        },
        removeEventListener(event: string, fn: MockEventListener) {
          if (!listeners[event]) return;
          listeners[event] = listeners[event].filter((l) => l !== fn);
        },
      };
      return element;
    },
    createElementNS(_ns: string, tag: string) {
      return this.createElement(tag);
    },
    createTextNode(text: string) {
      return {
        nodeType: 3,
        nodeValue: text,
        ownerDocument: doc,
      };
    },
    createComment(data: string) {
      return {
        nodeType: 8,
        nodeValue: data,
        ownerDocument: doc,
      };
    },
    defaultView: globalThis,
    addEventListener() {},
    removeEventListener() {},
  };

  const g = globalThis as unknown as Record<string, unknown>;
  g.document = doc;
  g.window = globalThis;
  g.Node = MockNode;
  g.Element = MockElement;
  g.HTMLElement = MockHTMLElement;
  g.HTMLIFrameElement = MockHTMLIFrameElement;
  g.HTMLDocument = MockHTMLDocument;
  g.Document = MockDocument;
  g.IS_REACT_ACT_ENVIRONMENT = true;
}
