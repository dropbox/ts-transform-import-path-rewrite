# ts-transform-import-path-rewrite
---
This is a TypeScript AST Transformer that allows you to rewrite import path in output JS & `d.ts` files accordingly. The primary use case for this is to mitigate different build system import structure, such as relative vs absolute `import` and aliasing output `import` paths.

## Usage
First of all, you need some level of familiarity with the [TypeScript Compiler API](https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API).

`compile.ts` & tests should have examples of how this works. The available options are:

### `projectBaseDir: string`
This is the base directory of your project folder. This is primarily used to determine the correct path when rewriting relative `import` to `absolute` import.

### `project?: string`
Project name to rewrite relative `import` to. For example:
```
import foo from './foo'
// Becomes
import foo from 'my-project-name/foo'
```
 
### `rewrite?(importPath: string, sourceFilePath: string): string`
Custom rewrite function to rewrite any `import` path we encounter to any new `import` path.