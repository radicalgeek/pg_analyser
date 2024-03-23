import { AnalysisResult, AnalysisMessage } from '../types/analysisResult';

export const groupResultsByTitle = (results: AnalysisResult[]): Record<string, AnalysisResult[]> => {
    return results.reduce((acc, result) => {
        (acc[result.title] = acc[result.title] || []).push(result);
        return acc;
    }, {} as Record<string, AnalysisResult[]>);
};

export const mergeResultsWithSameTitle = (groupedResults: Record<string, AnalysisResult[]>): AnalysisResult[] => {
    return Object.entries(groupedResults).map(([title, results]) => {
        const mergedMessages: AnalysisMessage[] = results.flatMap(result => result.messages);
        return { title, messages: mergedMessages };
    });
};

export const formatResultsForCLI = (results: AnalysisResult[]): string => {
    const color = {
        blue: "\x1b[34m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        red: "\x1b[31m",
        reset: "\x1b[0m"
    };

    return results.map(result => {
        const title = `${color.blue}${result.title}${color.reset}`;
        const formattedMessages = result.messages.map(message => {
            let messageColor;
            switch (message.type) {
                case "info":
                    messageColor = color.green;
                    break;
                case "warning":
                    messageColor = color.yellow;
                    break;
                case "error":
                    messageColor = color.red;
                    break;
                default:
                    messageColor = color.reset;
            }
            return `${messageColor}[${message.type.toUpperCase()}] ${message.text}${color.reset}`;
        });
        return `${title}\n${formattedMessages.join('\n')}`;
    }).join('\n\n');
};

 export const formatResultsForWeb = (results: AnalysisResult[]): string => {
    return JSON.stringify(results);
}

