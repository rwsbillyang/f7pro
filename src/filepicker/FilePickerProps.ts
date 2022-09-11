import { ReactNode } from "react";

/**
 * copy from https://github.com/imvq/react-file-picker/blob/main/src/types.ts
 * for support react 18
 * react 18 https://solverfox.dev/writing/no-implicit-children/  
 * https://juejin.cn/post/7090812134023495688 
 * https://juejin.cn/post/7094037148088664078
 * File picker props.
 */
export type FilePickerProps = {
  maxSize?: number;
  sizeUnit?: SizeUnit;
  extensions?: string | string[];
  onSuccess?: (...args: any[]) => any;
  onError?: (errorCode: number) => void;
  onFilePicked: (file: File) => void;
  children: ReactNode //for react 18
};

/**
 * Size unit value.
 */
export type SizeUnit = 'B' | 'KB' | 'MB' | 'GB';