export const openEditorPage = (editorPath: string): void => {
    const editorTab = window.open('', '_blank');

    if (editorTab) {
        editorTab.opener = null;
        editorTab.location.replace(editorPath);
        return;
    }

    window.location.assign(editorPath);
};
