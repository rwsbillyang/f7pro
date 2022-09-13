import {UmiListPagination} from "@rwsbillyang/usecache"


export interface SelectOption {
    label: string,
    value?: string | number | string[]
}
/**
 * value类型必须与SelectOption中的value类型一致，否则会找不到。
 * 如：SelectOption中的value通常是string类型，而此处的value当为数字时须将其转换成string
 */
export const selectOptionsValue2Label = (array: SelectOption[], value?: string | number | string[]) =>{
    if(!value) return ""
    for(let i = 0; i < array.length; i++){
        if(array[i].value === value)
            return array[i].label
    }
    return "unknown"
}

//用于传递给searchView的排序选项
export interface SortOption {
    label: string,
    pagination?: UmiListPagination
}

