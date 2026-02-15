export type DiagLevel = "info" | "warn" | "error";

export type DiagEvent = {
    ts: number;
    level: DiagLevel;
    topic: string;
    msg: string;
    data?: any;
};
