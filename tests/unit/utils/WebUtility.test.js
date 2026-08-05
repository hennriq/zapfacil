"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebUtility_1 = require("../../../src/shared/utils/WebUtility");
describe('WebUtility', () => {
    describe('encodeURLComponent', () => {
        it('should encode special characters', () => {
            const result = WebUtility_1.WebUtility.encodeURLComponent('hello world!');
            expect(result).toBe('hello%20world%21');
        });
        it('should encode Portuguese characters', () => {
            const result = WebUtility_1.WebUtility.encodeURLComponent('Olá, tudo bem?');
            expect(result).toContain('%');
        });
        it('should handle empty string', () => {
            const result = WebUtility_1.WebUtility.encodeURLComponent('');
            expect(result).toBe('');
        });
    });
    describe('decodeURLComponent', () => {
        it('should decode encoded characters', () => {
            const encoded = 'hello%20world%21';
            const result = WebUtility_1.WebUtility.decodeURLComponent(encoded);
            expect(result).toBe('hello world!');
        });
        it('should handle already decoded strings', () => {
            const result = WebUtility_1.WebUtility.decodeURLComponent('hello world');
            expect(result).toBe('hello world');
        });
    });
    describe('isValidURL', () => {
        it('should validate correct URLs', () => {
            expect(WebUtility_1.WebUtility.isValidURL('https://www.google.com')).toBe(true);
            expect(WebUtility_1.WebUtility.isValidURL('http://localhost:3000')).toBe(true);
            expect(WebUtility_1.WebUtility.isValidURL('https://web.whatsapp.com')).toBe(true);
        });
        it('should reject invalid URLs', () => {
            expect(WebUtility_1.WebUtility.isValidURL('not a url')).toBe(false);
            expect(WebUtility_1.WebUtility.isValidURL('ht tp://invalid.com')).toBe(false);
            expect(WebUtility_1.WebUtility.isValidURL('')).toBe(false);
        });
    });
    describe('extractDomain', () => {
        it('should extract domain from URL', () => {
            const result = WebUtility_1.WebUtility.extractDomain('https://www.google.com/search');
            expect(result).toBe('www.google.com');
        });
        it('should extract domain from WhatsApp URL', () => {
            const result = WebUtility_1.WebUtility.extractDomain('https://web.whatsapp.com/');
            expect(result).toBe('web.whatsapp.com');
        });
        it('should return empty string for invalid URL', () => {
            const result = WebUtility_1.WebUtility.extractDomain('invalid url');
            expect(result).toBe('');
        });
    });
});
//# sourceMappingURL=WebUtility.test.js.map