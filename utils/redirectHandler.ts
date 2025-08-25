// Redirect handler for Abstraxion callbacks
import * as Linking from 'expo-linking';

export class RedirectHandler {
    private static instance: RedirectHandler;
    private listeners: ((url: string) => void)[] = [];

    private constructor() {
        this.setupLinkingListeners();
    }

    static getInstance(): RedirectHandler {
        if (!RedirectHandler.instance) {
            RedirectHandler.instance = new RedirectHandler();
        }
        return RedirectHandler.instance;
    }

    private setupLinkingListeners() {
        // Handle initial URL if app was opened via deep link
        Linking.getInitialURL().then((url) => {
            if (url) {
                console.log('Initial URL:', url);
                this.handleUrl(url);
            }
        });

        // Handle URL changes when app is already running
        const subscription = Linking.addEventListener('url', (event) => {
            console.log('URL received:', event.url);
            this.handleUrl(event.url);
        });

        return subscription;
    }

    private handleUrl(url: string) {
        console.log('Handling URL:', url);

        // Check if it's an Abstraxion callback
        if (url.includes('abstraxion') || url.includes('auth')) {
            console.log('Abstraxion callback detected, processing...');

            // Notify all listeners
            this.listeners.forEach(listener => listener(url));

            // If we're on web, ensure we stay on the current page
            if (typeof window !== 'undefined') {
                // Remove any hash or query params that might interfere
                const cleanUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, '', cleanUrl);
            }
        }
    }

    addListener(listener: (url: string) => void) {
        this.listeners.push(listener);
    }

    removeListener(listener: (url: string) => void) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }
}

export const redirectHandler = RedirectHandler.getInstance();