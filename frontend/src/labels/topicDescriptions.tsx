import { Typography } from "@mui/material";
import React from "react";

export const topicDescriptions = {
    "#immortality": (
        <Typography>
            This topic emphasizes the perdurance of the reproductions.
        </Typography>
    ),
    "#exact_reproduction": (
        <Typography>
            In virtually all promotional materials between 1905 and 1926,
            the claim of exact and faithful reproduction, of absolute accurateness
            is consistently emphasized.
        </Typography>
    ),
    "#distinction_from_mechanical": (
        <Typography>
            Often, the adverts try to distinguish reproducing piano 
            rolls from mere mechanical methods (such as the player piano).
        </Typography>
    ),
    "#permanent_availability": "Permanent Availability",
    "#physical_presence": "Physical Presence",
    "#soul": "Soul",
    "#touched_listener": "Touched Listener",
    "#repeatability": "Repeatability",
    "#miracle": "Miracle",
    "#technical_invention": "Technical Invention",
    "#unreached_ideal": "Unreached Ideal",
    "#pedagogical_use": "Pedagogical Use",
    "#analogy_to_photography": "Analogy to Photography",
    "#home": "Home",
    "#ghost_illustration": "Ghost Illustration",
    "#affordability": "Affordability",
    "#sitting_woman": "Sitting Woman",
    "#analogy_to_phonograph": "Analogy to Phonograph",
    "#listening": "Listening"
} as { [index: string]: React.ReactElement | string }
