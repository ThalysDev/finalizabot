/**
 * Calcula quantos valores no array atendem à linha (>= line) nos últimos N elementos
 * @param shots - Array de shots (do mais antigo ao mais recente)
 * @param line - Linha do mercado (ex: 1.5)
 * @param lastN - Número de jogos a considerar (5 ou 10)
 */
export function calcHits(shots: number[], line: number, lastN: number): number {
  const normalizedLastN = Number.isFinite(lastN) ? Math.max(0, Math.trunc(lastN)) : 0;
  if (normalizedLastN === 0 || !Number.isFinite(line)) return 0;

  const relevant = shots.slice(-normalizedLastN).filter(Number.isFinite);
  return relevant.filter((s) => s >= line).length;
}

/**
 * Calcula a média de um array de números
 */
export function mean(arr: number[]): number {
  const values = arr.filter(Number.isFinite);
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calcula o desvio padrão populacional
 */
export function stdev(arr: number[]): number | null {
  const values = arr.filter(Number.isFinite);
  if (values.length === 0) return null;

  const avg = mean(values);
  const squaredDiffs = values.map((val) => Math.pow(val - avg, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Calcula o coeficiente de variação (CV = stdev / mean)
 * Retorna null se mean = 0 ou se há menos de 2 elementos
 */
export function calcCV(shots: number[]): number | null {
  const values = shots.filter(Number.isFinite);
  if (values.length < 2) return null;

  const avg = mean(values);
  if (avg === 0) return null;
  const sd = stdev(values);
  if (sd === null) return null;

  return sd / avg;
}
