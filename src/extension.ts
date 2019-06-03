'use strict';
import * as vscode from 'vscode';
import { Uri } from 'vscode';

type Option<T> = { value: T } | 'none';

type Direction = 'forward' | 'backward';

export function activate(context: vscode.ExtensionContext) {
    const command = (direction: Direction) => {
        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        cycle(editor.document.uri, direction);
    }

    context.subscriptions.push(vscode.commands.registerCommand('extension.powercycleForward',  () => command('forward')));
    context.subscriptions.push(vscode.commands.registerCommand('extension.powercycleBackward', () => command('backward')));
}

function getSortedUrisToCycleThrough(uri: Uri): Thenable<Uri[]> {
    let directory = getDirectory(uri)

    return findFiles(directory).then(uris => {
        return uris.sort();
    });
}

function getNextUri(currUri: Uri, direction: Direction): Thenable<Option<Uri>> {
    return getSortedUrisToCycleThrough(currUri)
    .then((uris: Uri[]): Option<Uri> => {
        let currUriString = currUri.toString()
        let currIndex = uris.findIndex(_ => _.toString() === currUriString)
        if (currIndex === -1) {
            return 'none'
        }

        const increment = direction === 'forward' ? 1 : -1
        const nextIndex = (currIndex + increment + uris.length) % uris.length;
        return { value: uris[nextIndex] }
    })
}

function getDirectory(uri: Uri): string {
    const parts = uri.path.split("/")
    parts.pop()
    return parts.join("/") + "/"
}

function adjustDirectoryForWorkspace(directory: string): string {
    let workspaceAdjustedDirectory = directory
    if (vscode.workspace.rootPath !== undefined) {
        if (directory.startsWith(vscode.workspace.rootPath)) {
            workspaceAdjustedDirectory = directory.slice(vscode.workspace.rootPath.length);

            if (workspaceAdjustedDirectory.startsWith("/")) {
                workspaceAdjustedDirectory = workspaceAdjustedDirectory.slice(1)
            }
        }
    }
    return workspaceAdjustedDirectory
}

function findFiles(directory: string): Thenable<Uri[]> {
    const workspaceAdjustedDirectory = adjustDirectoryForWorkspace(directory)
    const regex = vscode.workspace.getConfiguration("powercycle").regex
    return vscode.workspace.findFiles(`${workspaceAdjustedDirectory}${regex}`)
}

function openUri(uri: Uri): void {
    vscode.workspace.openTextDocument(uri).then(
        textDocument => {
            vscode.window.showTextDocument(textDocument);
        },
        error => {
            vscode.window.showInformationMessage(`File ${uri} could not be found.`);
        }
    )
}

function cycle(currUri: Uri, direction: Direction): void {
    getNextUri(currUri, direction)
    .then(maybeNextUri => {
        if (maybeNextUri === 'none') {
            vscode.window.showInformationMessage(`No next file to cycle to.`);
        }
        else {
            openUri(maybeNextUri.value)
        }
    })
}

export function deactivate() {}
