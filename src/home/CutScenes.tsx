
interface CutScenesProps {
    onBack: () => void;
    onSkip: () => void;
}

export const CutScenes = (props: CutScenesProps) => {

    return <div className="flex gap-3">
        <button onClick={props.onSkip}>SKIP</button>
        <button onClick={props.onBack}>BACK</button>
        <video />
    </div>;

}
