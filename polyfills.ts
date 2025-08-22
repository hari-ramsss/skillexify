// Polyfills for React Native compatibility
import 'react-native-get-random-values';

// Buffer
try {
	// @ts-ignore
	if (typeof global.Buffer === 'undefined') {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		global.Buffer = require('buffer').Buffer;
	}
} catch (error: any) {
	console.warn('Buffer polyfill not available:', error?.message || error);
}

// process
try {
	// @ts-ignore
	if (typeof global.process === 'undefined') {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		global.process = require('process');
	}
} catch (error: any) {
	console.warn('process polyfill not available:', error?.message || error);
}

// Ensure a minimal global.crypto exists so code can attach getRandomValues
try {
	// @ts-ignore
	if (typeof global.crypto === 'undefined') {
		// Create a minimal object; we'll attach getRandomValues below
		// @ts-ignore
		global.crypto = {};
	}
} catch (error: any) {
	console.warn('Unable to initialize global.crypto:', error?.message || error);
}

// TextEncoder/TextDecoder
try {
	// @ts-ignore
	if (typeof global.TextEncoder === 'undefined') {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		global.TextEncoder = require('text-encoding').TextEncoder;
	}
	// @ts-ignore
	if (typeof global.TextDecoder === 'undefined') {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		global.TextDecoder = require('text-encoding').TextDecoder;
	}
} catch (error: any) {
	console.warn('text-encoding polyfill not available:', error?.message || error);
}

// BigInt shim (for environments missing it)
try {
	// @ts-ignore
	if (typeof global.BigInt === 'undefined') {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const bigInt = require('big-integer');
		// Provide a minimal shim to avoid crashes; not a full BigInt replacement
		// @ts-ignore
		global.BigInt = (value: any) => bigInt(value);
	}
} catch (error: any) {
	console.warn('BigInt polyfill not available:', error?.message || error);
}

// Ensure crypto.getRandomValues is available
try {
	// @ts-ignore
	if (global.crypto && !global.crypto.getRandomValues) {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		global.crypto.getRandomValues = require('react-native-get-random-values').getRandomValues;
	}
} catch (error: any) {
	console.warn('getRandomValues polyfill not available:', error?.message || error);
}

// Additional polyfills for crypto compatibility
try {
	// @ts-ignore
	if (typeof global.crypto === 'undefined') {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		global.crypto = require('react-native-quick-crypto');
	}
} catch (error: any) {
	console.warn('react-native-quick-crypto not available:', error?.message || error);
}

// Ensure stream is available
try {
	// @ts-ignore
	if (typeof global.stream === 'undefined') {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		global.stream = require('readable-stream');
	}
} catch (error: any) {
	console.warn('readable-stream not available:', error?.message || error);
}

// Add Node.js module polyfills
try {
	// @ts-ignore
	if (typeof global.fs === 'undefined') {
		// @ts-ignore
		global.fs = {};
	}
	// @ts-ignore
	if (typeof global.path === 'undefined') {
		// @ts-ignore
		global.path = { sep: '/' };
	}
	// @ts-ignore
	if (typeof global.os === 'undefined') {
		// @ts-ignore
		global.os = { platform: () => 'react-native' };
	}
	// @ts-ignore
	if (typeof global.util === 'undefined') {
		// @ts-ignore
		global.util = { inherits: () => {} };
	}
	// @ts-ignore
	if (typeof global.assert === 'undefined') {
		// @ts-ignore
		global.assert = () => {};
	}
	// @ts-ignore
	if (typeof global.constants === 'undefined') {
		// @ts-ignore
		global.constants = {};
	}
	// @ts-ignore
	if (typeof global.events === 'undefined') {
		// @ts-ignore
		global.events = { EventEmitter: class {} };
	}
} catch (error: any) {
	console.warn('Node.js module polyfills not available:', error?.message || error);
}

console.log('✅ Polyfills loaded successfully');



