import { ItemBase } from "./ItemBase"
import { PageProps } from "./PageProps"

export interface EditPageProps<T extends ItemBase> extends PageProps {
    saveApi: string, //请求列表api，如'/api/oa/admin/save'
    saveText?: string //保存按钮文字可以定制
    saveCallback?: (item: Partial<T>)=> void //可以代替向远程提交代码，校验都会进行，无论是否提供saveCallback
}
