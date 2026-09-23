import { GazePoint, Fixation } from '../types/gaze.types';

/**
 * Word Position Interface
 * Represents the bounding box of a word in the document
 */
export interface WordPosition {
  word: string;
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  element: HTMLElement;
}

/**
 * Word Gaze Data Interface
 * Tracks gaze metrics for each word
 */
export interface WordGazeData {
  word: string;
  index: number;
  fixationCount: number;
  totalDuration: number;
  firstFixationTime?: number;
  lastFixationTime?: number;
  averageFixationDuration: number;
  regressionCount: number; // Number of times user returned to this word
  skipped: boolean; // Word was never fixated
}

/**
 * Reading Metrics Interface
 * Overall reading performance metrics
 */
export interface ReadingMetrics {
  totalWords: number;
  wordsRead: number;
  wordsSkipped: number;
  totalReadingTime: number;
  averageFixationDuration: number;
  regressionRate: number; // Percentage of backward saccades
  readingSpeed: number; // Words per minute
  comprehensionIndicator: number; // 0-1 score based on fixation patterns
}

/**
 * WordTracker Class
 * 
 * Analyzes word-level gaze behavior for reading assessment.
 * Tracks fixations on individual words, reading patterns, and comprehension indicators.
 * 
 * Features:
 * - Word position extraction from DOM
 * - Fixation-to-word mapping
 * - Reading metrics calculation
 * - Regression detection
 * - Comprehension estimation
 */
export class WordTracker {
  private wordPositions: WordPosition[] = [];
  private wordGazeData: Map<number, WordGazeData> = new Map();
  private previousWordIndex: number = -1;
  private regressionCount: number = 0;
  private startTime: number = 0;

  /**
   * Extract word positions from a text container
   * @param container - HTML element containing the text to analyze
   */
  public extractWordPositions(container: HTMLElement): WordPosition[] {
    this.wordPositions = [];
    this.wordGazeData.clear();
    this.previousWordIndex = -1;
    this.regressionCount = 0;
    this.startTime = Date.now();

    const textContent = container.innerText || container.textContent || '';
    const words = textContent.split(/\s+/).filter(word => word.length > 0);

    // Create temporary wrapper with span for each word
    const originalHTML = container.innerHTML;
    const wordSpans: string[] = [];
    
    words.forEach((word, index) => {
      wordSpans.push(`<span data-word-index="${index}">${word}</span>`);
    });

    // Temporarily replace content to get positions
    container.innerHTML = wordSpans.join(' ');

    // Extract positions
    const spans = container.querySelectorAll('[data-word-index]');
    spans.forEach((span, index) => {
      const rect = span.getBoundingClientRect();
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;

      this.wordPositions.push({
        word: words[index],
        index: index,
        x: rect.left + scrollX,
        y: rect.top + scrollY,
        width: rect.width,
        height: rect.height,
        element: span as HTMLElement
      });

      // Initialize word gaze data
      this.wordGazeData.set(index, {
        word: words[index],
        index: index,
        fixationCount: 0,
        totalDuration: 0,
        averageFixationDuration: 0,
        regressionCount: 0,
        skipped: true
      });
    });

    // Restore original HTML
    container.innerHTML = originalHTML;

    return this.wordPositions;
  }

  /**
   * Process fixation and map to word
   * @param fixation - Fixation point to process
   */
  public processFixation(fixation: Fixation): void {
    const wordIndex = this.getWordAtPosition(fixation.x, fixation.y);
    
    if (wordIndex === -1) return;

    const wordData = this.wordGazeData.get(wordIndex);
    if (!wordData) return;

    // Update word gaze data
    wordData.fixationCount++;
    wordData.totalDuration += fixation.duration;
    wordData.averageFixationDuration = wordData.totalDuration / wordData.fixationCount;
    wordData.skipped = false;

    if (!wordData.firstFixationTime) {
      wordData.firstFixationTime = fixation.timestamp;
    }
    wordData.lastFixationTime = fixation.timestamp;

    // Detect regression (backward reading)
    if (this.previousWordIndex !== -1 && wordIndex < this.previousWordIndex) {
      wordData.regressionCount++;
      this.regressionCount++;
    }

    this.previousWordIndex = wordIndex;
    this.wordGazeData.set(wordIndex, wordData);
  }

  /**
   * Find word at specific gaze coordinates
   * @param x - X coordinate
   * @param y - Y coordinate
   * @returns Word index or -1 if not found
   */
  private getWordAtPosition(x: number, y: number): number {
    for (const wordPos of this.wordPositions) {
      if (
        x >= wordPos.x &&
        x <= wordPos.x + wordPos.width &&
        y >= wordPos.y &&
        y <= wordPos.y + wordPos.height
      ) {
        return wordPos.index;
      }
    }
    return -1;
  }

  /**
   * Get gaze data for a specific word
   * @param index - Word index
   * @returns Word gaze data or undefined
   */
  public getWordGazeData(index: number): WordGazeData | undefined {
    return this.wordGazeData.get(index);
  }

  /**
   * Get all word gaze data
   * @returns Array of word gaze data
   */
  public getAllWordGazeData(): WordGazeData[] {
    return Array.from(this.wordGazeData.values());
  }

  /**
   * Calculate reading metrics
   * @returns Reading metrics object
   */
  public calculateReadingMetrics(): ReadingMetrics {
    const totalWords = this.wordPositions.length;
    const wordDataArray = Array.from(this.wordGazeData.values());
    
    const wordsRead = wordDataArray.filter(wd => !wd.skipped).length;
    const wordsSkipped = totalWords - wordsRead;
    
    const totalReadingTime = (Date.now() - this.startTime) / 1000; // seconds
    
    const totalFixationDuration = wordDataArray.reduce(
      (sum, wd) => sum + wd.totalDuration,
      0
    );
    const totalFixationCount = wordDataArray.reduce(
      (sum, wd) => sum + wd.fixationCount,
      0
    );
    
    const averageFixationDuration = totalFixationCount > 0
      ? totalFixationDuration / totalFixationCount
      : 0;

    const readingSpeed = totalReadingTime > 0
      ? (wordsRead / totalReadingTime) * 60 // WPM
      : 0;

    const regressionRate = totalFixationCount > 0
      ? (this.regressionCount / totalFixationCount) * 100
      : 0;

    // Comprehension indicator based on:
    // - Low skip rate (good)
    // - Moderate fixation duration (good)
    // - Low regression rate (good)
    const skipRate = totalWords > 0 ? wordsSkipped / totalWords : 1;
    const normalizedFixationDuration = Math.min(averageFixationDuration / 500, 1); // 500ms as reference
    const normalizedRegressionRate = Math.min(regressionRate / 20, 1); // 20% as reference

    const comprehensionIndicator = Math.max(0, Math.min(1,
      (1 - skipRate) * 0.4 +
      (1 - Math.abs(normalizedFixationDuration - 0.5) * 2) * 0.3 +
      (1 - normalizedRegressionRate) * 0.3
    ));

    return {
      totalWords,
      wordsRead,
      wordsSkipped,
      totalReadingTime,
      averageFixationDuration,
      regressionRate,
      readingSpeed,
      comprehensionIndicator
    };
  }

  /**
   * Get words with difficulty indicators
   * Words with high fixation count or long duration may indicate difficulty
   * @param threshold - Standard deviations above mean to flag as difficult
   * @returns Array of word indices flagged as difficult
   */
  public getDifficultWords(threshold: number = 1.5): number[] {
    const wordDataArray = Array.from(this.wordGazeData.values())
      .filter(wd => !wd.skipped);

    if (wordDataArray.length === 0) return [];

    // Calculate mean and standard deviation for fixation count
    const meanFixationCount = wordDataArray.reduce(
      (sum, wd) => sum + wd.fixationCount,
      0
    ) / wordDataArray.length;

    const stdDevFixationCount = Math.sqrt(
      wordDataArray.reduce(
        (sum, wd) => sum + Math.pow(wd.fixationCount - meanFixationCount, 2),
        0
      ) / wordDataArray.length
    );

    // Calculate mean and standard deviation for average duration
    const meanDuration = wordDataArray.reduce(
      (sum, wd) => sum + wd.averageFixationDuration,
      0
    ) / wordDataArray.length;

    const stdDevDuration = Math.sqrt(
      wordDataArray.reduce(
        (sum, wd) => sum + Math.pow(wd.averageFixationDuration - meanDuration, 2),
        0
      ) / wordDataArray.length
    );

    // Flag words exceeding threshold
    const difficultWords: number[] = [];

    wordDataArray.forEach(wd => {
      const fixationZScore = (wd.fixationCount - meanFixationCount) / (stdDevFixationCount || 1);
      const durationZScore = (wd.averageFixationDuration - meanDuration) / (stdDevDuration || 1);

      if (fixationZScore > threshold || durationZScore > threshold || wd.regressionCount > 2) {
        difficultWords.push(wd.index);
      }
    });

    return difficultWords;
  }

  /**
   * Export data for backend analysis
   * @returns Serializable object with all tracking data
   */
  public exportData(): {
    wordPositions: Omit<WordPosition, 'element'>[];
    wordGazeData: WordGazeData[];
    readingMetrics: ReadingMetrics;
    difficultWords: number[];
  } {
    return {
      wordPositions: this.wordPositions.map(({ element, ...rest }) => rest),
      wordGazeData: this.getAllWordGazeData(),
      readingMetrics: this.calculateReadingMetrics(),
      difficultWords: this.getDifficultWords()
    };
  }

  /**
   * Reset tracker
   */
  public reset(): void {
    this.wordPositions = [];
    this.wordGazeData.clear();
    this.previousWordIndex = -1;
    this.regressionCount = 0;
    this.startTime = 0;
  }
}

export default WordTracker;
