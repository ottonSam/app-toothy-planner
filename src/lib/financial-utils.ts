export function formatCurrencyBr(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    style: 'currency',
  }).format(value);
}

export function formatReferenceMonth(month: number, year: number) {
  const date = new Date(year, month - 1, 1);

  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}
