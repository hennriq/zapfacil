import { PhoneValidationService } from '../../../src/main/services/PhoneValidationService'

describe('PhoneValidationService', () => {
  let service: PhoneValidationService

  beforeEach(() => {
    service = new PhoneValidationService()
  })

  describe('validate', () => {
    it('should validate Brazilian phone numbers with 11 digits', () => {
      expect(service.validate('11999999999')).toBe(true)
    })

    it('should validate phone numbers with country code', () => {
      expect(service.validate('5511999999999')).toBe(true)
    })

    it('should validate phone numbers with formatting', () => {
      expect(service.validate('(11)99999999')).toBe(true)
      expect(service.validate('+55 11 99999999')).toBe(true)
    })

    it('should reject empty phone numbers', () => {
      expect(service.validate('')).toBe(false)
      expect(service.validate(null as any)).toBe(false)
      expect(service.validate(undefined as any)).toBe(false)
    })

    it('should reject phone numbers with invalid length', () => {
      expect(service.validate('123')).toBe(false)
      expect(service.validate('1234567890123456789')).toBe(false)
    })

    it('should handle non-string inputs', () => {
      expect(service.validate(123456 as any)).toBe(false)
    })
  })

  describe('format', () => {
    it('should format Brazilian phone to international format', () => {
      const result = service.format('11999999999')
      expect(result).toBe('5511999999999')
    })

    it('should preserve phone already with country code', () => {
      const result = service.format('5511999999999')
      expect(result).toBe('5511999999999')
    })

    it('should remove formatting characters', () => {
      const result = service.format('(11) 99999-9999')
      expect(result).toBe('5511999999999')
    })

    it('should throw on empty phone', () => {
      expect(() => service.format('')).toThrow()
    })

    it('should throw on invalid format', () => {
      expect(() => service.format('123')).toThrow()
    })
  })

  describe('unformat', () => {
    it('should remove all non-numeric characters', () => {
      const result = service.unformat('(11) 99999-9999')
      expect(result).toBe('11999999999')
    })

    it('should return original if already unformatted', () => {
      const result = service.unformat('11999999999')
      expect(result).toBe('11999999999')
    })
  })

  describe('extractCountryCode', () => {
    it('should extract country code 55 for Brazilian numbers', () => {
      const result = service.extractCountryCode('5511999999999')
      expect(result).toBe('55')
    })

    it('should return BR for Brazilian format without country code', () => {
      const result = service.extractCountryCode('11999999999')
      expect(result).toBe('BR')
    })
  })
})
