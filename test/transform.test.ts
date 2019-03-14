import compile from "../compile";
import { resolve } from "path";
import { expect } from "chai";
import { Opts as PathTransformOpts } from "../src";
import { readFile } from "fs-extra";

const opts: PathTransformOpts = {
  projectBaseDir: resolve(__dirname, ".."),
  project: "dummy-project",
  rewrite(importPath) {
    if (importPath.startsWith("fs-extra")) {
      return "rewritten/fs-extra";
    }
  },
  alias: {
    '^(glob)$': 'external/$1'
  }
};

describe("import path rewrite should work", function() {
  this.timeout(5000);
  beforeEach(function() {
    compile(resolve(__dirname, "fixture/foo.ts"), opts);
  });
  it("in js output", function() {
    return readFile(resolve(__dirname, "fixture/foo.js"), "utf8").then(content => {
      expect(content).to.equal(
`import { dummy } from "dummy-project/test/fixture/bar";
import * as fsExtra from "rewritten/fs-extra";
import { sync } from "external/glob";
import { hasMagic } from "external/glob";
export function dummyFs(fn) {
    fsExtra.readFileSync(fn);
}
export const dummy1 = dummy + 1;
export const readFile = fsExtra.readFile;
export const globSync = sync;
export const hasMagic1 = hasMagic;
export { dummy2 } from "dummy-project/test/fixture/bar";
export * from "dummy-project/test/fixture/bar";
`
      )
    });
  });
  it("in d.ts output", function() {
    return readFile(resolve(__dirname, "fixture/foo.d.ts"), "utf8").then(content => {
      expect(content).to.contain(
        'import * as fsExtra from "rewritten/fs-extra";'
      );
      expect(content).to.contain(
        'export { dummy2 } from "dummy-project/test/fixture/bar";'
      );
      expect(content).to.contain(
        'export * from "dummy-project/test/fixture/bar";'
      );
    });
  });
});
