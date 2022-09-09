/**
 * 基于ListItem的上传文件/清除文件列表项，具体的上传和清除操作自己实现
 * @param title listItem的title
 * @param name 上传的字段名
 * @param url 原有网址，非空的时候将是删除
 * @param onFileOpened 选中文件后的回调，第一个参数是文件，第二个参数传递进来的name
 * @param onFileDelete 删除文件
 * 
 */
 export interface UploaderProps {
    title: string,
    name: string,
    url?: string,
    onFileOpened: (file: File, name: string) => void,
    onFileDelete: (url: string, name: string) => void,
    onUrlEditDone: (url: string, name: string) => void
}