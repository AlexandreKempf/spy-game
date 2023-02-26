import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import UnoCSS from 'unocss/vite'
import { extractorSvelte } from '@unocss/core'
import { presetAttributify, presetUno } from 'unocss'

export default defineConfig({
	plugins: [
		UnoCSS({
			extractors: [extractorSvelte], mode: 'svelte-scoped',
			presets: [
				presetAttributify({ /* preset options */ }),
				presetUno(),
				// ...custom presets
			],
		}), sveltekit(),
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
