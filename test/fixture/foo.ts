import { dummy } from "./bar";
import * as fsExtra from "fs-extra";
import {sync} from 'glob'
import {hasMagic} from 'glob'
export function dummyFs(fn: string) {
  fsExtra.readFileSync(fn);
  return import("./bar")
}
export const dummy1 = dummy + 1;
export const readFile = fsExtra.readFile;
export const globSync = sync
export const hasMagic1 = hasMagic
export {dummy2} from './bar'
export * from './bar'