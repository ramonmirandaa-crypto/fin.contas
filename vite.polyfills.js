import { Blob as NodeBlob } from "buffer";

// Dockploy's Node 18 runtime lacks the global `File` constructor that Undici
// expects. Ensure `globalThis.File` is defined before any Vite plugins run.
const BlobCtor = globalThis.Blob ?? NodeBlob;

if (typeof globalThis.File === "undefined" && BlobCtor) {
  class NodeFile extends BlobCtor {
    constructor(fileBits = [], fileName = "", options = {}) {
      super(fileBits, options);
      this.name = fileName;
      this.lastModified = options.lastModified ?? Date.now();
    }

    get [Symbol.toStringTag]() {
      return "File";
    }
  }

  globalThis.File = NodeFile;
}
