// utils/quoteUtils.ts

const QUOTES: string[] = [
  "The only way to do great work is to love what you do.",
  "Believe you can and you're halfway there.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "Success is not final, failure is not fatal: It is the courage to continue that counts.",
  "The expert in anything was once a beginner.",
  "Don't watch the clock; do what it does. Keep going.",
  "It always seems impossible until it's done.",
  "Strive not to be a success, but rather to be of value.",
  "Your time is limited, don't waste it living someone else's life.",
  "The best way to predict the future is to create it.",
  "Hard work beats talent when talent doesn't work hard.",
  "The mind is everything. What you think you become.",
  "Learning is the only thing the mind never exhausts, never fears, and never regrets.",
  "Go confidently in the direction of your dreams! Live the life you've imagined.",
  "If you are not willing to risk the usual, you will have to settle for the ordinary.",
  "Patience, persistence and perspiration make an unbeatable combination for success.",
  "The journey of a thousand miles begins with a single step.",
  "Study hard what interests you the most in the most undisciplined, irreverent and original manner possible.",
  "The beautiful thing about learning is that no one can take it away from you.",
  "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
  "The only person you are destined to become is the person you decide to be.",
  "Your attitude, not your aptitude, will determine your altitude.",
  "Opportunity is missed by most people because it is dressed in overalls and looks like work.",
  "Great things never come from comfort zones.",
  "The difference between ordinary and extraordinary is that little 'extra'.",
];

/**
 * Returns a motivational quote based on the current date, ensuring a new quote daily.
 * @param date The current Date object.
 * @returns A motivational quote string.
 */
export function getDailyQuote(date: Date): string {
  // Get a consistent day index regardless of time of day
  // This calculates the day of the year relative to the local time of the date object.
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  // Use modulo to cycle through quotes list
  const quoteIndex = dayOfYear % QUOTES.length;
  return QUOTES[quoteIndex];
}