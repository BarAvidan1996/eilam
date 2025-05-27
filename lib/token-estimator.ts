// חישוב מספר טוקנים משוער (4 תווים = 1 טוקן בממוצע)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}
