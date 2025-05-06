import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
    define: {
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
    },
    plugins: [react()],
    server: {
        port: 5176,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            'micromark-extension-math': 'micromark-extension-llm-math'
        },
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
    },
    css: {
        preprocessorOptions: {
            less: {
                javascriptEnabled: true, // Required for Semantic UI
                modifyVars: {
                    // Customize Semantic UI variables if needed
                }
            }
        }
    },
    build: {
        outDir: '../build/default', // Matches your existing build output
        emptyOutDir: true, // Clear the output directory before building
        sourcemap: true, // Enable source maps for production
        rollupOptions: {
            output: {
                manualChunks: {
                    // Split vendor chunks if needed
                    react: ['react', 'react-dom', 'react-router-dom'],
                    i18next: ['i18next', 'i18next-browser-languagedetector', 'react-i18next'],
                    ui: ['semantic-ui-react', 'semantic-ui-css'],
                    charts: ['recharts'],
                    utils: ['axios', 'moment', 'marked']
                }
            }
        }
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            'i18next',
            'react-i18next',
            'semantic-ui-react',
            'axios',
            'moment',
            'marked'
        ]
    }
});