/**
 * Type declarations for react-native-html-to-pdf
 * Extends the existing types with additional configuration options
 */

declare module 'react-native-html-to-pdf' {
  export interface Options {
    html: string;
    fileName: string;
    directory?: 'Documents' | 'Downloads';
    base64?: boolean;
    width?: number;
    height?: number;
    padding?: number;
    bgColor?: string;
  }

  export interface Result {
    filePath: string;
    base64?: string;
  }

  export default class RNHTMLtoPDF {
    static convert(options: Options): Promise<Result>;
  }
}
