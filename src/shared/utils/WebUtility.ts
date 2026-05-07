/**
 * WebUtility - Funções utilitárias para web/URL
 * Segue Single Responsibility Principle
 */
export class WebUtility {
  /**
   * Codifica string para uso em URL
   */
  static encodeURLComponent(text: string): string {
    return encodeURIComponent(text)
  }

  /**
   * Decodifica string de URL
   */
  static decodeURLComponent(text: string): string {
    return decodeURIComponent(text)
  }

  /**
   * Valida se é uma URL válida
   */
  static isValidURL(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Extrai domínio de uma URL
   */
  static extractDomain(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return ''
    }
  }
}
