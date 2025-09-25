/**
 * Dockploy's Node 18 runtime lacks the global `File` constructor that Undici
 * expects. This shim runs before Vite loads any plugins so the build can finish
 * even on older Node releases.
 */
type BlobLike = {
  size: number;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
  slice(start?: number, end?: number, contentType?: string): BlobLike;
  stream(): unknown;
  text(): Promise<string>;
};

type BlobConstructor = new (...args: unknown[]) => BlobLike;

if (typeof (globalThis as { File?: unknown }).File === "undefined") {
  const BlobCtor = (globalThis as { Blob?: BlobConstructor }).Blob;

  if (BlobCtor) {
    class NodeFile extends BlobCtor {
      name: string;
      lastModified: number;

      constructor(
        fileBits: unknown[] = [],
        fileName = "",
        options: { lastModified?: number } = {},
      ) {
        super(fileBits, options);
        this.name = fileName;
        this.lastModified = options.lastModified ?? Date.now();
      }

      get [Symbol.toStringTag]() {
        return "File";
      }
    }

    (globalThis as Record<string, unknown>).File = NodeFile;
  }
}
