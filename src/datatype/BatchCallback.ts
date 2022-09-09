import { ItemBase } from "./ItemBase"


export interface BatchCallback<T extends ItemBase> {
    label: string
    needConfirm?: boolean
    confirmTip?: string //对话框提示
    callback: (selected: T[]) => void //批量操作执行动作
}
