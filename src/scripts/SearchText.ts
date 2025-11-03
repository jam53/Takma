import leven from 'leven';

/**
 * Text search logic that handles exact, all-words, and fuzzy modes
 * based on the provided query and target text.
 *
 * It supports:
 * 1. Empty query matches everything.
 * 2. **Exact match** using double quotes (e.g., "project scope").
 * 3. **Hybrid Match** (unquoted query, one or more words): Ensures ALL words in the query
 * are present in the target text. Each word is matched either by **literal substring** * (e.g., 'launch') OR a **fuzzy match** (Levenshtein distance <= 2, e.g., 'reort' matches 'report').
 *
 * @param searchQuery The string to search for.
 * @param searchableText The entire body of text to search within.
 * @param maxFuzzyDistance The maximum allowed Levenshtein distance for a fuzzy match. Defaults to 2.
 * @returns True if a match is found, false otherwise.
 */
export function performSearchInText(searchQuery: string, searchableText: string, maxFuzzyDistance: number = 2): boolean {
    const normalizedQuery = searchQuery.toLowerCase().trim();

    // 1. Initial Check: Empty/Whitespace string should match everything
    if (normalizedQuery.length === 0) {
        return true;
    }

    // 2. Exact Phrase Match (Quotes)
    if (normalizedQuery.startsWith('"') && normalizedQuery.endsWith('"')) {
        const exactPhrase = normalizedQuery.slice(1, -1).trim();

        // If the content *inside* the quotes is empty (e.g., just ""), match everything
        if (exactPhrase.length === 0) {
            return true
        }

        return searchableText.includes(exactPhrase);
    }

    //region 3. Search logic for NO QUOTES (Hybrid Fuzzy/All-Words)
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);

    if (queryWords.length === 0) {
        return true;
    }

    // Get a set of all unique words in the card's content to compare against
    const targetWords = new Set(searchableText.split(/\s+/).filter(w => w.length > 0));

    // The result is TRUE only if ALL query words can be matched (either exactly or fuzzily)
    return queryWords.every(queryWord => {
        // Check 1: Does the query word exist as a direct substring? (Fastest check)
        if (searchableText.includes(queryWord)) {
            return true;
        }

        // Check 2: Does the query word fuzzily match ANY target word?
        for (const targetWord of targetWords) {
            // Use Levenshtein distance for the fuzzy check
            if (leven(queryWord, targetWord) <= maxFuzzyDistance) {
                return true;
            }
        }

        return false;
    });
    //endregion
}