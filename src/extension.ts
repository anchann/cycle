'use strict';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.cycle', () => {
        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        let fullPath = editor.document.fileName
        cycle(fullPath);
    });

    context.subscriptions.push(disposable);
}

function cycle(filePath: string): void {
    let fullFileName = filePath.substr(0, filePath.lastIndexOf('.'))
    let extension = filePath.split('.').pop()
    let fileName = fullFileName.substr(filePath.lastIndexOf('/') + 1)

    vscode.workspace.findFiles(`**/${fileName}.*`).then(uris => {
        let extensions = [... new Set(uris.map(uri => uri.path.split('.').pop()))];
        if (extensions.length < 2) {
            vscode.window.showInformationMessage(`There exists no files with an extension differing from ${fullFileName}.${extension}.`);
            return;
        }
        let index = extensions.indexOf(extension);
        let newIndex = nextIndex(index, extensions);
        let newExtension = extensions[newIndex];
        
        vscode.workspace.openTextDocument(`${fullFileName}.${newExtension}`).then(
            textDocument => {
                vscode.window.showTextDocument(textDocument);
            },
            error => {
                vscode.window.showInformationMessage(`File ${fullFileName}.${newExtension} could not be found.`);
            }
        )
    });
}

function nextIndex(currentIndex: number, items: any[]): number {
    return (currentIndex + 1 === items.length) ? 0 : currentIndex + 1;
}

export function deactivate() {}
