import { Typography } from "@mui/material";
import React from "react";

export const topicDescriptions = {
    "#immortality": (
        <Typography>
            This topic emphasizes the perdurance of the reproductions and 
            how thus the recording artists become immortal.
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
    "#touch_of_a_button": (
        <Typography>
            The Welte-Mignon is permanently available for the entertainment 
            of the owner – on the touch of a button.
        </Typography>
    ),
    "#virtual_presence": "Physical Presence",
    "#soulfulness": "Soulfulness",
    "#listening": "Revelled Listening",
    "#repeatability": "Repeatability",
    "#miracle": "Miracle",
    "#technical_invention": "Technical Invention",
    "#unreached_ideal": "Ideal Instrument",
    "#educational_use": "Educational Use",
    "#analogy_to_photography": "Analogy to Photography",
    "#home": "Home",
    "#immediate_recognizability": "Immediate Recognizability",
    "#secret": (
        <Typography>
            Perfect reproduction and its manufacturing is a secret
            possessed only by the Welte-Mignon company.
        </Typography>
    ),
    "#phantom_body": "Phantom Body",
    "#affordability": "Affordability",
    "#sitting_woman": "Sitting Woman",
    "#analogy_to_phonograph": "Analogy to Phonograph",
} as { [index: string]: React.ReactElement | string }
