import { dummy } from "./bar";
import * as fsExtra from "external/fs-extra";
export function dummyFs(fn) {
    fsExtra.readFileSync(fn);
}
export var dummy1 = dummy + 1;
export var readFile = fsExtra.readFile;
export { dummy2 } from './bar';
export * from './bar';
