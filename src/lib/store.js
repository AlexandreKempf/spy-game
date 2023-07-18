import { writable } from 'svelte/store';

export const masterInfo = writable({ level: "01_tutorial", state: "playerSelection" });
export const playerInfo = writable({ name: "", skin: "Abby", color: "#ff0000", master: false, lightOn: true, victory: false, multiplayerScreen: false, animationScore: 0, position: [0, 0] })

