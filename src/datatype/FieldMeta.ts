import { ListInputProps } from "framework7-react/components/list-input";
import { MyAsyncSelectProps } from "./MyAsyncSelectProps";
import { SelectOption, SortOption } from "./SelectOption";


export interface FieldMeta<T> extends ListInputProps{
    depend?: (e?: Partial<T>) => boolean; //若指定了依赖：返回true时才显示该项否则不显示，没指定依赖，则都显示
    selectOptions?: SelectOption[]; //额外添加，当type为select时需指定
    objectProps?: FieldMeta<T>[]; // if type is object 
   
    sortOptions?: SortOption[]; //额外添加，当type为sort时需指定，用于搜索排序

    //if type is asyncSelect:  
    asyncSelectProps?: MyAsyncSelectProps;
 
    cfgPasteHandler?: (text: string) => Partial<T>; //某些字段在复制粘贴后，进行解析，自动填写某些字段 
    onPaste?:(event: React.ClipboardEvent<HTMLTextAreaElement>)=>void; //若指定了onPasteHandler则自动添加onPaste进行处理。https://www.kindacode.com/article/react-typescript-handle-oncopy-oncut-and-onpaste-events/

    isSearchKey?: boolean; //当为true时，则作为搜索字段进行搜索

    name: string;//字段名称, 改为必须指定
}