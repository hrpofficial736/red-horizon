import { useState } from "react";
import App from "../App";
import LandingPage from "./LandingPage"
import { CutScenes } from "./CutScenes";
import GuideBook from "./Guide";

const guideImages = [
    "/images/guide/guide-1.png",
    "/images/guide/guide-2.png",
    "/images/guide/guide-3.png",
    "/images/guide/guide-4.png",
    "/images/guide/guide-5.png",
    "/images/guide/guide-6.png",
];


export const Home = () => {
    const playerType = localStorage.getItem("playerType");

    const [section, setSection] = useState(1);

    if (!playerType || playerType === "new") {
        localStorage.setItem("playerType", "new")

        // deciding which section to display
        if (section === 1) return <LandingPage onStart={() => setSection(2)} />;

        else if (section === 2) return <CutScenes onSkip={() => setSection(3)} onBack={() => setSection(1)} />

        else if (section === 3) return <GuideBook onBack={() => setSection(2)} onStartGame={() => {
            setSection(4)
            localStorage.setItem("playerType", "existing")
        }} images={guideImages} />

        else return <App />

    }

    return <App />
}
