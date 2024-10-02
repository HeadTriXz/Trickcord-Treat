import { ItemRarity } from "../../utils/index.js";
import config from "../../config.js";

export default [
    {
        label: "Common",
        value: "" + ItemRarity.Common,
        emoji: {
            id: config.emotes.common.id,
            name: config.emotes.common.name
        }
    },
    {
        label: "Uncommon",
        value: "" + ItemRarity.Uncommon,
        emoji: {
            id: config.emotes.uncommon.id,
            name: config.emotes.uncommon.name
        }
    },
    {
        label: "Rare",
        value: "" + ItemRarity.Rare,
        emoji: {
            id: config.emotes.rare.id,
            name: config.emotes.rare.name
        }
    }
];
