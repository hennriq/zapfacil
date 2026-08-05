import { WebUtility } from '../../../src/shared/utils/WebUtility'

describe('WebUtility', () => {
  describe('encodeURLComponent', () => {
    it('should encode special characters', () => {
      const result = WebUtility.encodeURLComponent('hello world!')
      expect(result).toBe('hello%20world%21')
    })

    it('should encode Portuguese characters', () => {
      const result = WebUtility.encodeURLComponent('Olá, tudo bem?')
      expect(result).toContain('%')
    })

    it('should handle empty string', () => {
      const result = WebUtility.encodeURLComponent('')
      expect(result).toBe('')
    })
  })

  describe('decodeURLComponent', () => {
    it('should decode encoded characters', () => {
      const encoded = 'hello%20world%21'
      const result = WebUtility.decodeURLComponent(encoded)
      expect(result).toBe('hello world!')
    })

    it('should handle already decoded strings', () => {
      const result = WebUtility.decodeURLComponent('hello world')
      expect(result).toBe('hello world')
    })
  })

  describe('isValidURL', () => {
    it('should validate correct URLs', () => {
      expect(WebUtility.isValidURL('https://www.google.com')).toBe(true)
      expect(WebUtility.isValidURL('http://localhost:3000')).toBe(true)
      expect(WebUtility.isValidURL('https://web.whatsapp.com')).toBe(true)
    })

    it('should reject invalid URLs', () => {
      expect(WebUtility.isValidURL('not a url')).toBe(false)
      expect(WebUtility.isValidURL('ht tp://invalid.com')).toBe(false)
      expect(WebUtility.isValidURL('')).toBe(false)
    })
  })

  describe('extractDomain', () => {
    it('should extract domain from URL', () => {
      const result = WebUtility.extractDomain('https://www.google.com/search')
      expect(result).toBe('www.google.com')
    })

    it('should extract domain from WhatsApp URL', () => {
      const result = WebUtility.extractDomain('https://web.whatsapp.com/')
      expect(result).toBe('web.whatsapp.com')
    })

    it('should return empty string for invalid URL', () => {
      const result = WebUtility.extractDomain('invalid url')
      expect(result).toBe('')
    })
  })
})
