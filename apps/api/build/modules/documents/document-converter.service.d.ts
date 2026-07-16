export declare class DocumentConverterService {
    private readonly logger;
    docxToHtml(buffer: Buffer): Promise<{
        html: string;
        warnings: string[];
    }>;
    docxToText(buffer: Buffer): Promise<string>;
}
