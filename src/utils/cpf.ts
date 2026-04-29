// Remove formatação: "123.456.789-01" → "12345678901"
export function sanitizeCPF(cpf: string): string {
    return cpf.replace(/\D/g, '')
}

// Valida se o CPF tem 11 dígitos (validação básica)
export function isValidCPF(cpf: string): boolean {
    const clean = sanitizeCPF(cpf)
    return clean.length === 11
}