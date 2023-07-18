import { writable } from 'svelte/store';

export const gameInfo = writable({ level: "01_tutorial", state: "rules", lightOn: true });

export const playerInfo = writable({ name: "Abby", color: "#ff0000" })