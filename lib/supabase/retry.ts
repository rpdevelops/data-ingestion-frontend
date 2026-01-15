/**
 * Utility function to retry Supabase operations with exponential backoff
 */

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
};

/**
 * Retries a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on the last attempt
      if (attempt === opts.maxRetries) {
        break;
      }

      // Check if it's a retryable error
      if (!isRetryableError(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.baseDelay * Math.pow(2, attempt),
        opts.maxDelay
      );

      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Determines if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  
  const errorMessage = (error as Error).message?.toLowerCase() || '';
  
  // Network-related errors that should be retried
  const retryablePatterns = [
    'fetch failed',
    'network error',
    'timeout',
    'connection',
    'econnreset',
    'enotfound',
    'econnrefused',
    'etimedout',
    'socket hang up'
  ];

  return retryablePatterns.some(pattern => errorMessage.includes(pattern));
}

/**
 * Creates a timeout promise that rejects after specified time
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    )
  ]);
}

/**
 * Combines retry logic with timeout
 */
export async function retryWithTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 30000, // 30 seconds default
  retryOptions: RetryOptions = {}
): Promise<T> {
  return retryWithBackoff(
    () => withTimeout(operation(), timeoutMs),
    retryOptions
  );
}
