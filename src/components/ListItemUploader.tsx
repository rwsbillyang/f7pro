import React from 'react';
//https://www.npmjs.com/package/@mavedev/react-file-picker
//https://github.com/mavedev/react-file-picker
//Bug: extension若只是指定扩展名，android提示没有对应的应用打开，iOS没有问题；
//使用image/*，android和iOS都正常，但FilePicker对扩展名校验出错。因此使用image/*加扩展名的方式
import FilePicker, { InputErrorCode } from '@mavedev/react-file-picker';
import { f7, ListItem, SwipeoutActions, SwipeoutButton } from 'framework7-react';
import { UploaderProps } from '../datatype/UploaderProps';



export const ListItemUploader: React.FC<UploaderProps> = (props) => {
    const { title, name, url, onFileOpened, onFileDelete, onUrlEditDone} = props

    const openEditUrl = (url?: string) =>
    f7.dialog.prompt('无需上传图片， 直接填写图片链接（注意：微信里不可使用阿里系图片，原因你懂的）', (value: string) => { onUrlEditDone(value, name)}, (value: string)=>{}, url)

    if (url) {
        return (
            <ListItem swipeout title={title} link="#" onClick={() => onFileDelete(url, name)}>
                <SwipeoutActions left>
                    {url.indexOf("/upload/") === 0 ?  <SwipeoutButton color="red" close onClick={() => onFileDelete(url, name)}>删除图片</SwipeoutButton>: 
                     <SwipeoutButton color="yellow" close onClick={() => openEditUrl(url)}>编辑图片链接</SwipeoutButton>}
                </SwipeoutActions>
                <img slot="after-title" width="32" height="32" src={url} style={{ marginLeft: "75px", borderRadius: "0.2em" }} />
                <div slot="after" style={{ fontSize: "12px", color: "red" }}> 删除 </div>
            </ListItem>
        )
    } else {
        return (
            // react 18 https://solverfox.dev/writing/no-implicit-children/  https://juejin.cn/post/7090812134023495688  https://juejin.cn/post/7094037148088664078
            //@ts-ignore 
            <FilePicker
                maxSize={10}
                sizeUnit='MB'
                extensions={['image/*', '.jpg', '.jpeg', '.png', '.webp','.gif']}
                onFilePicked={(file) => onFileOpened(file, name)}
                onSuccess={() => { console.log('Success'); }}
                onError={errorCode => {
                    if (InputErrorCode.containsExtensionError(errorCode)) {
                        console.log('File has inappropriate extension');
                        f7.toast.show({ text: "不支持的图片" })
                    } else if (InputErrorCode.containsMaxSizeError(errorCode)) {
                        console.log('File size exceeded max size specified');
                        f7.toast.show({ text: "图片不能超过10MB" })
                    } else {
                        console.log(InputErrorCode);
                        f7.toast.show({ text: "出错了" })
                    }
                }}
            >
              <ListItem swipeout title={title} link="#">
                    {/* <Icon  slot="after-title" f7="cloud_upload" size={24} style={{marginLeft:"75px" }}/> */}
                    <SwipeoutActions left>
                        <SwipeoutButton color="yellow" close onClick={() => openEditUrl(url)}>添加图片链接</SwipeoutButton>
                    </SwipeoutActions>
                    <div slot="after" style={{ fontSize: "12px", color: "#007aff" }}> 上传 </div>
                    <div slot="title" style={{ fontSize: "12px", color: "gray" }}>→向右滑动，添加图片链接,无需上传 </div>
                </ListItem>  
            </FilePicker>
        )
    }

}


 //iOS not support arrayBuffer()
export const readAsArrayBuffer = (blob: Blob) => {
    return new Promise((resolve: (buffer: ArrayBuffer) => void, reject) => {
        const fr = new FileReader();
        fr.onerror = reject;
        fr.onload = function () {
            if (fr.result) resolve(fr.result as ArrayBuffer);
            else reject("no value")
        }
        fr.readAsArrayBuffer(blob);
    });
}