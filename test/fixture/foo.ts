import { dummy } from "./bar";
import * as fsExtra from "fs-extra";
export function dummyFs(fn: string) {
  fsExtra.readFileSync(fn);
}
export const dummy1 = dummy + 1;
export const readFile = fsExtra.readFile;
export {dummy2} from './bar'
export * from './bar'