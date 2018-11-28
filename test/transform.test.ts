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
  }
};

describe("import path rewrite should work", function() {
  this.timeout(5000);
  beforeEach(function() {
    compile(resolve(__dirname, "fixture/foo.ts"), opts);
  });
  it("in js output", function(done) {
    readFile(resolve(__dirname, "fixture/foo.js"), "utf8").then(content => {
      expect(content).to.contain(
        'import { dummy } from "dummy-project/test/fixture/bar";'
      );
      expect(content).to.contain(
        'import * as fsExtra from "rewritten/fs-extra";'
      );
      done();
    });
  });
  it("in d.ts output", function(done) {
    readFile(resolve(__dirname, "fixture/foo.d.ts"), "utf8").then(content => {
      expect(content).to.contain(
        'import * as fsExtra from "rewritten/fs-extra";'
      );
      done();
    });
  });
});
