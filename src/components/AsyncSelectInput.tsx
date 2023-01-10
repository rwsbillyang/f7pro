import { CacheStorage, CODE, DataBox, getDataFromBox, StorageType, UseCacheConfig } from "@rwsbillyang/usecache"


import { ListInput } from "framework7-react"
import { ListInputProps } from "framework7-react/components/list-input"
import React, { SyntheticEvent, useEffect, useState } from "react"
import { f7ProConfig } from "../Config"
import { MyAsyncSelectProps } from "../datatype/MyAsyncSelectProps"
import { SelectOption } from "../datatype/SelectOption"



/***
 * 由react管理state的受控组件，异步加载选项
 * 空值使用"-2"标识
 */
//使用React.FC将会使li标签到ul外面去了
//  export const AsynSelectInput: React.FC<{
//     inputProps: ListInputProps, 
//     onValueChange: (newValue?: string|number) => void,
//     asyncProps?: MyAsyncSelectProps
// }> = (props) => {
    const AsynSelectInput = (inputProps: ListInputProps, 
        onValueChange: (newValue?: string|number) => void, key: any,
        asyncProps?: MyAsyncSelectProps)  => {
        
       
        //不设置为"null"，是因为某些Int类型不支持"null"；不设置为“-1”，是因为有些state值为-1，避免混淆
        const OptionEmptyValue = "-2" //如果设置为""空值，onChange得到是label如"请选择"而不是空，变成非受控组件
    
        const emptyOption: SelectOption = { label: "请选择", value: OptionEmptyValue } 
        const loadingOption: SelectOption = { label: "加载中", value: OptionEmptyValue }
        const [options, setOptions] = useState([loadingOption])
        const [selected, setSelected] = useState(inputProps.value || inputProps.defaultValue || OptionEmptyValue) //AsynSelectInput内部维护的选项值，还有可能外部重新指定了该值（如搜索重置）
        inputProps.defaultValue = undefined //因异步加载，必须使用受控组件，react接管状态管理，去掉其defaultValue属性值
        if(inputProps.value === undefined) inputProps.value = OptionEmptyValue

        useEffect(() => {
            if (asyncProps) fetchCachely(asyncProps)
        }, [])
    
        const fetchCachely = (asyncProps: MyAsyncSelectProps) => {
            const { key, url, query, convertFunc } = asyncProps
            const storageType = StorageType.OnlySessionStorage
            const fetchData = (query?: object | string | any[]) => {
                const get = UseCacheConfig.request?.get
                if(get){
                    get(url, query)
                    .then(res => {
                        const box: DataBox<any> = res.data
                        if (box.code === CODE.OK) {
                            const data = getDataFromBox(box)
                            if (data) {
                                CacheStorage.saveObject(key, data, storageType)
                                setOptions([emptyOption].concat(data.map((e) => convertFunc(e))))
                                setSelected(selected)
                            } else {
                                if(f7ProConfig.EnableLog) console.log("AsynSelectInput: no data from url=" + url)
                                setOptions([emptyOption])
                            }
                        } else {
                            if(f7ProConfig.EnableLog) console.log("AsynSelectInput: fail load from url=" + url + ", box.code=" + box.code)
                            setOptions([emptyOption])
                        }
                    })
                    .catch(err => {
                        if(f7ProConfig.EnableLog) console.log("AsynSelectInput: fail to load options from url=" + url+",err: "+err)
                        setOptions([emptyOption])
                    })
                }else{
                    console.warn("AsynSelectInput: not config UseCacheConfig.request?")
                }
                
            }
    
            //明确指定使用cache且不是在搜索
            const v = CacheStorage.getItem(key, storageType)
            if (v) {
                setOptions([emptyOption].concat(JSON.parse(v).map((e) => convertFunc(e))))
                setSelected(selected)
            } else {
                fetchData(query)
            }
        }
    
        return (
            <ListInput
                key={key}
                {...inputProps}
                type="select"
                
                //因异步加载，加载完成后指定其新的值，需要使用受控组件
                //defaultValue={selected} //非受控组件： 用户输入A => input 中显示A
                value={selected} //受控组件： 用户输入A => 触发onChange事件 => handleChange 中设置 setState("A") => 渲染input使他的value变成A
                onChange={(event: SyntheticEvent) => {
    
                    const target = event.target as HTMLInputElement
                    const newValue = target.value
                    //如果设置option的值为空字符串，将得到label作为它的值；
                    //方案1：为了让onValidate校验失败，应将OptionNullValue设置为不符合pattern，否则OptionNullValue依然被校验成功。方案失败：似乎没按pattern进行校验，onValidate总是校验成功
                    //方案2：去掉属性中的valiate和pattern，不让F7进行校验；只要存在required，则自行设置校验结果
                    if (newValue === OptionEmptyValue) 
                        onValueChange(undefined)//OptionEmptyValue为空值
                    else
                        onValueChange(newValue)
    
                    setSelected(newValue)
                }}
            >
                {options?.map((option: SelectOption, i: number) => <option key={i} value={option.value || option.label}>{option.label}</option>)}
            </ListInput>
        )
    }
    
    export default AsynSelectInput 