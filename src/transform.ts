/**
 * AST Transformer to rewrite any ImportDeclaration paths.
 * This is typically used to rewrite relative imports into absolute imports
 * and mitigate import path differences w/ metaserver
 */
import * as ts from 'typescript'
import { resolve, dirname } from 'path'

export interface Opts {
    projectBaseDir: string
    project?: string
    rewrite?(importPath: string, sourceFilePath: string): string
    alias?: Record<string, string>
}

/**
 * Rewrite relative import to absolute import or trigger
 * rewrite callback
 *
 * @param {string} importPath import path
 * @param {ts.SourceFile} sf Source file
 * @param {Opts} opts
 * @returns
 */
function rewritePath(importPath: string, sf: ts.SourceFile, opts: Opts, regexps: Record<string, RegExp>) {
    if (opts.project && importPath.startsWith('.')) {
        const path = resolve(dirname(sf.fileName), importPath).split(opts.projectBaseDir)[1]
        return `${opts.project}${path}`
    }

    Object.keys(regexps).forEach(str => {
        const regex = regexps[str]
        importPath = importPath.replace(regex, opts.alias[str])
    })

    if (typeof opts.rewrite === 'function') {
        return opts.rewrite(importPath, sf.fileName) || importPath
    }

    return importPath
}

function isDynamicImport(node: ts.Node): node is ts.CallExpression {
    return ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword
}

function importExportVisitor(
    ctx: ts.TransformationContext,
    sf: ts.SourceFile,
    opts: Opts = { projectBaseDir: '' },
    regexps: Record<string, RegExp>
) {
    const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
        let importPath: string
        if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
            const importPathWithQuotes = node.moduleSpecifier.getText(sf)
            importPath = importPathWithQuotes.substr(1, importPathWithQuotes.length - 2)
        } else if (isDynamicImport(node)) {
            const importPathWithQuotes = node.arguments[0].getText(sf)
            importPath = importPathWithQuotes.substr(1, importPathWithQuotes.length - 2)
        } else if (
            ts.isImportTypeNode(node) &&
            ts.isLiteralTypeNode(node.argument) &&
            ts.isStringLiteral(node.argument.literal)
        ) {
            importPath = node.argument.literal.text // `.text` instead of `getText` bc this node doesn't map to sf (it's generated d.ts)
        }

        if (importPath) {
            const rewrittenPath = rewritePath(importPath, sf, opts, regexps)
            const newNode = ts.getMutableClone(node)
            // Only rewrite relative path
            if (rewrittenPath !== importPath) {
                if (ts.isImportDeclaration(newNode) || ts.isExportDeclaration(newNode)) {
                    newNode.moduleSpecifier = ts.createLiteral(rewrittenPath)
                } else if (isDynamicImport(newNode)) {
                    newNode.arguments = ts.createNodeArray([ts.createStringLiteral(rewrittenPath)])
                } else if (ts.isImportTypeNode(newNode)) {
                    newNode.argument = ts.createLiteralTypeNode(ts.createStringLiteral(rewrittenPath))
                }

                return newNode
            }
        }
        return ts.visitEachChild(node, visitor, ctx)
    }

    return visitor
}

export function transformDts(opts: Opts): ts.TransformerFactory<ts.SourceFile> {
    const { alias = {} } = opts
    const regexps: Record<string, RegExp> = Object.keys(alias).reduce(
        (all, regexString) => {
            all[regexString] = new RegExp(regexString, 'gi')
            return all
        },
        {} as Record<string, RegExp>
    )
    return (ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
        return (sf: ts.SourceFile) => ts.visitNode(sf, importExportVisitor(ctx, sf, opts, regexps))
    }
}

/**
 * Check to make sure this is a define node in AMD `define` node
 *
 * @param {ts.Node} node AST node
 * @returns true if this is a `define` node, false otherwise
 */
function isDefineNode(node: ts.Node) {
    return (
        node.kind === ts.SyntaxKind.CallExpression &&
        ((node as ts.CallExpression).expression as ts.Identifier).text === 'define' &&
        (node as ts.CallExpression).arguments.length === 2 &&
        ts.isArrayLiteralExpression((node as ts.CallExpression).arguments[0]) &&
        ts.isFunctionExpression((node as ts.CallExpression).arguments[1])
    )
}

function amdVisitor(
    ctx: ts.TransformationContext,
    sf: ts.SourceFile,
    opts: Opts = { projectBaseDir: '' },
    regexps: Record<string, RegExp>
) {
    const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
        if (isDefineNode(node)) {
            const importPathsWithQuotes = ((node as ts.CallExpression).arguments[0] as ts.ArrayLiteralExpression)
                .elements
            const importPaths = importPathsWithQuotes
                .map(path => (path as ts.StringLiteral).text)
                .map(importPath => rewritePath(importPath, sf, opts, regexps))
                .map(p => ts.createStringLiteral(p))
            return ts.createCall(ts.createIdentifier('define'), undefined, [
                ts.createArrayLiteral(importPaths),
                (node as ts.CallExpression).arguments[1],
            ])
        }
        return ts.visitEachChild(node, visitor, ctx)
    }

    return visitor
}

export function transformAmd(opts: Opts): ts.TransformerFactory<ts.SourceFile> {
    const { alias = {} } = opts
    const regexps: Record<string, RegExp> = Object.keys(alias).reduce(
        (all, regexString) => {
            all[regexString] = new RegExp(regexString, 'gi')
            return all
        },
        {} as Record<string, RegExp>
    )
    return (ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
        return (sf: ts.SourceFile) => ts.visitNode(sf, amdVisitor(ctx, sf, opts, regexps))
    }
}
