import { AnalysisResult } from '../types/analysisResult';

export const groupResultsByTitle = (results: AnalysisResult[]): Record<string, AnalysisResult[]> => {
    return results.reduce((acc, result) => {
        (acc[result.title] = acc[result.title] || []).push(result);
        return acc;
    }, {} as Record<string, AnalysisResult[]>);
};

export const mergeResultsWithSameTitle = (groupedResults: Record<string, AnalysisResult[]>): AnalysisResult[] => {
    return Object.entries(groupedResults).map(([title, results]) => {
        const mergedMessages = results.flatMap(result => result.messages);
        return { title, messages: mergedMessages };
    });
};

export const formatResultsForCLI = (results: AnalysisResult[]): string => {
    return results.map(result => {
      return `${result.title}\n${result.messages.join('\n')}`;
    }).join('\n\n');
  }

 export const formatResultsForWeb = (results: AnalysisResult[]): string => {
    return JSON.stringify(results);
}

