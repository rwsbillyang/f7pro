import { SelectOption } from "./SelectOption"

export interface MyAsyncSelectProps {
    key: string //缓存键
    url: string, //请求url
    query?: object | string | any[], //请求参数
    convertFunc: (item: any) => SelectOption //将请求结果转换为select option
}