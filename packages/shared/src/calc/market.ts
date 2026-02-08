/**
 * Calcula quantos valores no array atendem à linha (>= line) nos últimos N elementos
 * @param shots - Array de shots (do mais antigo ao mais recente)
 * @param line - Linha do mercado (ex: 1.5)
 * @param lastN - Número de jogos a considerar (5 ou 10)
 */
export function calcHits(shots: number[], line: number, lastN: number): number {
  const relevant = shots.slice(-lastN);
  return relevant.filter((s) => s >= line).length;
}

/**
 * Calcula a média de um array de números
 */
export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Calcula o desvio padrão populacional
 */
export function stdev(arr: number[]): number | null {
  if (arr.length === 0) return null;
  const avg = mean(arr);
  const squaredDiffs = arr.map((val) => Math.pow(val - avg, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / arr.length;
  return Math.sqrt(variance);
}

/**
 * Calcula o coeficiente de variação (CV = stdev / mean)
 * Retorna null se mean = 0 ou se há menos de 2 elementos
 */
export function calcCV(shots: number[]): number | null {
  if (shots.length < 2) return null;
  const avg = mean(shots);
  if (avg === 0) return null;
  const sd = stdev(shots);
  if (sd === null) return null;
  return sd / avg;
}
