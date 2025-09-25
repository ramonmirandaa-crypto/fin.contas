// Minimal JSX namespace fallback to ensure TypeScript compiles
// even when React's type definitions are not available at build time.
declare global {
  namespace JSX {
    interface Element {}
    interface ElementClass {
      render: unknown;
    }
    interface ElementAttributesProperty {
      props: unknown;
    }
    interface ElementChildrenAttribute {
      children: unknown;
    }
    interface IntrinsicElements {
      [elemName: string]: unknown;
    }
  }
}

export {};
