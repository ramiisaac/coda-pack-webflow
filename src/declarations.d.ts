declare module '@webflow/webflow-designer-api' {
  export class DesignerClient {
    constructor(options: { accessToken: string });
    insertEmoji(elementId: string, emoji: string): Promise<void>;
    // Add other methods as needed
  }
}
