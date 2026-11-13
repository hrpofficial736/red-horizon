import { useState } from "react";
import App from "../App";
import LandingPage from "./LandingPage";
import { CutScenes } from "./CutScenes";
import GuideBook from "./Guide";

import inventory from "../assets/guidebook/inventory.webp";
import construction from "../assets/guidebook/constructions.webp";
import overview from "../assets/guidebook/overview.webp";
import production from "../assets/guidebook/production.webp";
import research from "../assets/guidebook/reseach.webp";
import module from "../assets/guidebook/module status.webp";

const guideImages = [
  overview,
  inventory,
  construction,
  production,
  research,
  module,
];

export const Home = () => {
    const [view, setView] = useState(() => {
        const isExisting = localStorage.getItem("playerType") === "existing";
        return isExisting ? "app" : "landing";
    });

    useState(() => {
        if (!localStorage.getItem("playerType")) {
            localStorage.setItem("playerType", "new");
        }
    });

    const handleCompleteOnboarding = () => {
        localStorage.setItem("playerType", "existing");
        setView("app");
    };

    switch (view) {
        case "landing":
            return <LandingPage onStart={() => setView("cutscenes")} />;

        case "cutscenes":
            return (
                <CutScenes
                    onSkip={() => setView("guide")}
                    onBack={() => setView("landing")}
                />
            );

        case "guide":
            return (
                <GuideBook
                    images={guideImages}
                    onBack={() => setView("cutscenes")}
                    onStartGame={handleCompleteOnboarding}
                />
            );

        case "app":
        default:
            return <App onBackToHome={() => setView("landing")} />;
    }
};
