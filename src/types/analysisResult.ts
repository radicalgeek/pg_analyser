export interface AnalysisResult {
    title: string;
    messages: AnalysisMessage[];
  }

  export interface AnalysisMessage {
    text: string;
    type: MessageType;
  }

  export enum MessageType {
    Error = "error",
    Warning = "warning",
    Info = "info",
  }