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
  const playerType = localStorage.getItem("playerType");

  const [section, setSection] = useState(1);

  if (!playerType || playerType === "new") {
    localStorage.setItem("playerType", "new");

    // deciding which section to display
    if (section === 1) return <LandingPage onStart={() => setSection(2)} />;
    else if (section === 2)
      return (
        <CutScenes onSkip={() => setSection(3)} onBack={() => setSection(1)} />
      );
    else if (section === 3)
      return (
        <GuideBook
          onBack={() => setSection(2)}
          onStartGame={() => {
            setSection(4);
            localStorage.setItem("playerType", "existing");
          }}
          images={guideImages}
        />
      );
    else
      return (
        <App
          onBackToHome={() => {
            localStorage.setItem("playerType", "new");
            setSection(1);
          }}
        />
      );
  }

  return (
    <App
      onBackToHome={() => {
        localStorage.setItem("playerType", "new");
        setSection(1);
      }}
    />
  );
};
