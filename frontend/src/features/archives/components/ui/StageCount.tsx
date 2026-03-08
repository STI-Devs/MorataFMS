export const StageCount = ({
    stageList, uploadedKeys,
}: {
    stageList: ReadonlyArray<{ readonly key: string; readonly label: string }>;
    uploadedKeys: Set<string>;
}) => {
    const done = stageList.filter(s => uploadedKeys.has(s.key)).length;
    const isComplete = done === stageList.length;
    const tooltip = stageList.map(s => `${uploadedKeys.has(s.key) ? '✓' : '○'} ${s.label}`).join('\n');
    return (
        <span title={tooltip}
            className={`text-xs font-semibold tabular-nums ${isComplete ? 'text-emerald-600' : done === 0 ? 'text-gray-400' : 'text-amber-500'}`}>
            {done}/{stageList.length}
        </span>
    );
};
