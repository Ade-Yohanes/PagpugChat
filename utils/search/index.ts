/**
 * Search Utilities
 * Centralized exports for all search-related functionality
 */

export { performSmartSearch } from './smart-search';
export { performWebSearch } from './web-search';

// Re-export types for convenience
export type { 
  SmartSearchConfig, 
  SearchResult, 
  SmartSearchResult 
} from './smart-search';

/**
 * Search pipeline utilities
 * 
 * This folder contains:
 * - smart-search.ts: AI-powered search pipeline with query rewriting and RAG
 * - web-search.ts: Direct web search via SearXNG proxy
 * - index.ts: Centralized exports (this file)
 */