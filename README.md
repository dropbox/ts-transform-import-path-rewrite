# ts-transform-import-path-rewrite

![build status](https://travis-ci.org/dropbox/ts-transform-import-path-rewrite.svg?branch=master)

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

## License

Copyright (c) 2018 Dropbox, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.