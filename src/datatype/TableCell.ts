import { ItemBase } from "./ItemBase";



export interface TableCell<T extends ItemBase> {
    label: string, //表头名称
    className: "label-cell" | "numeric-cell" | "medium-only",
    cellValue: (e: T) => string | number | undefined//用于从TableData中的T中取值
}