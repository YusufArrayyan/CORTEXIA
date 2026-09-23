import {
  PronunciationAssessment,
  WordAlignment,
  ReadingError,
  ReadingFluencyMetrics,
  WordRecognitionResult,
  ProsodyAnalysis
} from '../types/speech.types';

/**
 * Levenshtein Distance
 * Calculate minimum edit distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1].toLowerCase() === str2[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * String Similarity
 * Calculate similarity score between two strings (0-1)
 */
function stringSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;
  
  const distance = levenshteinDistance(str1, str2);
  return 1 - (distance / maxLength);
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

/**
 * PronunciationAnalyzer Class
 * 
 * Analyzes pronunciation accuracy by comparing expected text with recognized speech.
 * Uses dynamic programming for word alignment and various metrics for assessment.
 * 
 * Features:
 * - Word-level alignment
 * - Pronunciation accuracy scoring
 * - Error detection (omission, insertion, substitution)
 * - Fluency metrics calculation
 * - Prosody analysis
 */
export class PronunciationAnalyzer {
  private expectedWords: string[] = [];
  private recognizedWords: string[] = [];
  private wordTimings: Map<string, number[]> = new Map();
  private startTime: number = 0;
  private endTime: number = 0;
  private pauseDurations: number[] = [];

  /**
   * Set expected text (reference text)
   */
  public setExpectedText(text: string): void {
    const normalized = normalizeText(text);
    this.expectedWords = normalized.split(/\s+/).filter(w => w.length > 0);
    console.log(`📝 Expected ${this.expectedWords.length} words`);
  }

  /**
   * Set recognized text (from speech recognition)
   */
  public setRecognizedText(text: string): void {
    const normalized = normalizeText(text);
    this.recognizedWords = normalized.split(/\s+/).filter(w => w.length > 0);
    console.log(`🎤 Recognized ${this.recognizedWords.length} words`);
  }

  /**
   * Add word timing information
   */
  public addWordTiming(word: string, timestamp: number): void {
    const normalized = normalizeText(word);
    if (!this.wordTimings.has(normalized)) {
      this.wordTimings.set(normalized, []);
    }
    this.wordTimings.get(normalized)!.push(timestamp);
  }

  /**
   * Set session timing
   */
  public setSessionTiming(startTime: number, endTime: number): void {
    this.startTime = startTime;
    this.endTime = endTime;
  }

  /**
   * Add pause duration
   */
  public addPause(duration: number): void {
    this.pauseDurations.push(duration);
  }

  /**
   * Perform word alignment using dynamic programming
   * Returns array of word alignments
   */
  public alignWords(): WordAlignment[] {
    const m = this.expectedWords.length;
    const n = this.recognizedWords.length;

    // DP table: dp[i][j] = cost of aligning expected[0..i-1] with recognized[0..j-1]
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    const backtrack: string[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(''));

    // Initialize
    for (let i = 0; i <= m; i++) {
      dp[i][0] = i; // Deletion cost
      backtrack[i][0] = 'D';
    }
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j; // Insertion cost
      backtrack[0][j] = 'I';
    }

    // Fill DP table
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const expectedWord = this.expectedWords[i - 1];
        const recognizedWord = this.recognizedWords[j - 1];
        
        // Calculate similarity (0 = match, higher = worse)
        const similarity = stringSimilarity(expectedWord, recognizedWord);
        const matchCost = similarity >= 0.7 ? 0 : 1; // Consider >70% similarity as match

        const costs = [
          dp[i - 1][j - 1] + matchCost, // Match/Substitution
          dp[i - 1][j] + 1,              // Deletion (omission)
          dp[i][j - 1] + 1               // Insertion
        ];

        const minCost = Math.min(...costs);
        dp[i][j] = minCost;

        if (minCost === costs[0]) {
          backtrack[i][j] = matchCost === 0 ? 'M' : 'S'; // Match or Substitution
        } else if (minCost === costs[1]) {
          backtrack[i][j] = 'D'; // Deletion
        } else {
          backtrack[i][j] = 'I'; // Insertion
        }
      }
    }

    // Backtrack to get alignment
    const alignments: WordAlignment[] = [];
    let i = m;
    let j = n;

    while (i > 0 || j > 0) {
      const operation = backtrack[i][j];

      if (operation === 'M' || operation === 'S') {
        // Match or Substitution
        const expectedWord = this.expectedWords[i - 1];
        const recognizedWord = this.recognizedWords[j - 1];
        const similarity = stringSimilarity(expectedWord, recognizedWord);

        alignments.unshift({
          expectedWord,
          recognizedWord,
          alignmentType: operation === 'M' ? 'match' : 'substitution',
          confidence: similarity,
          timestamp: Date.now()
        });
        i--;
        j--;
      } else if (operation === 'D') {
        // Deletion (omission)
        alignments.unshift({
          expectedWord: this.expectedWords[i - 1],
          recognizedWord: undefined,
          alignmentType: 'deletion',
          confidence: 0,
          timestamp: Date.now()
        });
        i--;
      } else if (operation === 'I') {
        // Insertion
        alignments.unshift({
          expectedWord: '',
          recognizedWord: this.recognizedWords[j - 1],
          alignmentType: 'insertion',
          confidence: 0.5,
          timestamp: Date.now()
        });
        j--;
      } else {
        break;
      }
    }

    return alignments;
  }

  /**
   * Assess pronunciation for each word
   */
  public assessPronunciation(): PronunciationAssessment[] {
    const alignments = this.alignWords();
    const assessments: PronunciationAssessment[] = [];

    for (const alignment of alignments) {
      const assessment: PronunciationAssessment = {
        word: alignment.recognizedWord || '',
        expectedWord: alignment.expectedWord,
        accuracy: alignment.confidence,
        isCorrect: alignment.alignmentType === 'match',
        isMispronounced: alignment.alignmentType === 'substitution',
        isOmitted: alignment.alignmentType === 'deletion',
        isInserted: alignment.alignmentType === 'insertion'
      };

      assessments.push(assessment);
    }

    return assessments;
  }

  /**
   * Detect reading errors
   */
  public detectErrors(): ReadingError[] {
    const alignments = this.alignWords();
    const errors: ReadingError[] = [];

    alignments.forEach((alignment, index) => {
      if (alignment.alignmentType !== 'match') {
        let errorType: ReadingError['type'];
        let severity: ReadingError['severity'];

        switch (alignment.alignmentType) {
          case 'substitution':
            errorType = 'mispronunciation';
            severity = alignment.confidence > 0.5 ? 'low' : 'high';
            break;
          case 'deletion':
            errorType = 'omission';
            severity = 'high';
            break;
          case 'insertion':
            errorType = 'insertion';
            severity = 'medium';
            break;
          default:
            return;
        }

        errors.push({
          type: errorType,
          position: index,
          expectedWord: alignment.expectedWord,
          actualWord: alignment.recognizedWord,
          timestamp: alignment.timestamp,
          severity
        });
      }
    });

    return errors;
  }

  /**
   * Calculate prosody analysis
   */
  public calculateProsody(): ProsodyAnalysis {
    const totalDuration = (this.endTime - this.startTime) / 1000; // seconds
    const wordCount = this.recognizedWords.length;

    const speakingRate = totalDuration > 0 ? (wordCount / totalDuration) * 60 : 0; // WPM

    const pauseCount = this.pauseDurations.length;
    const averagePauseDuration = pauseCount > 0
      ? this.pauseDurations.reduce((sum, d) => sum + d, 0) / pauseCount
      : 0;
    const longestPauseDuration = pauseCount > 0
      ? Math.max(...this.pauseDurations)
      : 0;

    // Estimate variations (placeholder - would need audio analysis for real values)
    const pitchVariation = 0.6; // 0-1 score
    const volumeVariation = 0.5; // 0-1 score

    // Calculate fluency score based on speaking rate and pauses
    const idealRate = 120; // WPM for comfortable reading
    const rateScore = Math.max(0, 1 - Math.abs(speakingRate - idealRate) / idealRate);
    const pauseScore = Math.max(0, 1 - (pauseCount / wordCount) * 2);
    const fluencyScore = (rateScore * 0.6 + pauseScore * 0.4);

    // Monotone indicator (lower variation = more monotone)
    const monotoneIndicator = 1 - ((pitchVariation + volumeVariation) / 2);

    return {
      speakingRate,
      pauseCount,
      averagePauseDuration,
      longestPauseDuration,
      pitchVariation,
      volumeVariation,
      fluencyScore,
      monotoneIndicator
    };
  }

  /**
   * Calculate complete reading fluency metrics
   */
  public calculateFluencyMetrics(): ReadingFluencyMetrics {
    const alignments = this.alignWords();
    
    let correctWords = 0;
    let incorrectWords = 0;
    let omittedWords = 0;
    let insertedWords = 0;
    let substitutedWords = 0;

    alignments.forEach(alignment => {
      switch (alignment.alignmentType) {
        case 'match':
          correctWords++;
          break;
        case 'substitution':
          substitutedWords++;
          incorrectWords++;
          break;
        case 'deletion':
          omittedWords++;
          incorrectWords++;
          break;
        case 'insertion':
          insertedWords++;
          break;
      }
    });

    const totalWords = this.expectedWords.length;
    const accuracy = totalWords > 0 ? correctWords / totalWords : 0;

    const totalDuration = (this.endTime - this.startTime) / 1000; // seconds
    const wordsPerMinute = totalDuration > 0 
      ? (this.recognizedWords.length / totalDuration) * 60 
      : 0;
    const correctWordsPerMinute = totalDuration > 0
      ? (correctWords / totalDuration) * 60
      : 0;

    const prosody = this.calculateProsody();

    // Detect hesitations, repetitions, self-corrections (simplified)
    const hesitationCount = this.pauseDurations.filter(d => d > 1000).length; // Pauses > 1 second
    const repetitionCount = this.detectRepetitions();
    const selfCorrectionCount = this.detectSelfCorrections();

    // Calculate overall fluency score
    const accuracyWeight = 0.4;
    const speedWeight = 0.3;
    const prosodyWeight = 0.3;

    const speedScore = Math.min(1, wordsPerMinute / 120); // Normalize to 120 WPM
    const overallFluencyScore = (
      accuracy * accuracyWeight +
      speedScore * speedWeight +
      prosody.fluencyScore * prosodyWeight
    );

    return {
      totalWords,
      correctWords,
      incorrectWords,
      omittedWords,
      insertedWords,
      substitutedWords,
      accuracy,
      wordsPerMinute,
      correctWordsPerMinute,
      prosody,
      hesitationCount,
      repetitionCount,
      selfCorrectionCount,
      overallFluencyScore
    };
  }

  /**
   * Detect word repetitions
   */
  private detectRepetitions(): number {
    let repetitionCount = 0;
    for (let i = 1; i < this.recognizedWords.length; i++) {
      if (this.recognizedWords[i] === this.recognizedWords[i - 1]) {
        repetitionCount++;
      }
    }
    return repetitionCount;
  }

  /**
   * Detect self-corrections (simplified heuristic)
   */
  private detectSelfCorrections(): number {
    // Look for patterns like "word1 word2 word1" (correction pattern)
    let correctionCount = 0;
    for (let i = 2; i < this.recognizedWords.length; i++) {
      if (this.recognizedWords[i] === this.recognizedWords[i - 2] &&
          this.recognizedWords[i] !== this.recognizedWords[i - 1]) {
        correctionCount++;
      }
    }
    return correctionCount;
  }

  /**
   * Get difficulty level based on fluency score
   */
  public getDifficultyLevel(fluencyScore: number): string {
    if (fluencyScore >= 0.8) return 'Sangat Baik';
    if (fluencyScore >= 0.6) return 'Baik';
    if (fluencyScore >= 0.4) return 'Cukup';
    if (fluencyScore >= 0.2) return 'Kurang';
    return 'Sangat Kurang';
  }

  /**
   * Export data for backend
   */
  public exportData(): {
    expectedWords: string[];
    recognizedWords: string[];
    alignments: WordAlignment[];
    pronunciationAssessments: PronunciationAssessment[];
    errors: ReadingError[];
    fluencyMetrics: ReadingFluencyMetrics;
  } {
    return {
      expectedWords: this.expectedWords,
      recognizedWords: this.recognizedWords,
      alignments: this.alignWords(),
      pronunciationAssessments: this.assessPronunciation(),
      errors: this.detectErrors(),
      fluencyMetrics: this.calculateFluencyMetrics()
    };
  }

  /**
   * Reset analyzer
   */
  public reset(): void {
    this.expectedWords = [];
    this.recognizedWords = [];
    this.wordTimings.clear();
    this.startTime = 0;
    this.endTime = 0;
    this.pauseDurations = [];
  }
}

export default PronunciationAnalyzer;
