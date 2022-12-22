import {
    Button, f7,
    List, Navbar, Page, Toolbar
} from 'framework7-react';
import React, { useEffect, useRef, useState } from 'react';


import { Cache, fetchWithLoading, UseCacheConfig } from "@rwsbillyang/usecache";
import { ListProps } from 'framework7-react/components/list';

import { FieldMetaToListInput } from './FieldMetaToListInput';
import { ItemBase } from './datatype/ItemBase';
import { FieldMeta } from './datatype/FieldMeta';
import { f7ProConfig } from './Config';
import { EditPageProps } from './datatype/EditPageProps';


//处理event，并调用配置的onPasteHandler进行处理
function doPaste<T extends ItemBase>(
    event: React.ClipboardEvent<HTMLTextAreaElement>,
    cfgPasteHandler: (text: string) => Partial<T>,
    name: string, //在何处粘贴
    data: Partial<T>, //解析后的值放在data中
    checkValidResults: {} //校验结果
) {
    const text = event.clipboardData.getData("text")//得到剪贴板数据
    const part = cfgPasteHandler(text)//调用配置的handler解析数据
    const keys = Object.keys(part)//得到解析后的各字段值

    if (keys.length === 0) {//未能解析到值
        data[name] = text
        checkValidResults[name] = true
    } else {
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i]
            data[k] = part[k]
            //TODO: 调用pattern检查合法性
            if (part[k]) checkValidResults[name] = true
            //f7.input.checkEmptyState(key)
        }
    }

    event.preventDefault();
}

function addPasteHandler<T extends ItemBase>(
    fields: FieldMeta<T>[],
    item: Partial<T>,
    checkValidResults: {},
    parentFieldName?: string) {
    const handles: any = []
    for (let i = 0; i < fields.length; i++) {
        const e: FieldMeta<T> = fields[i]
        if (e.type === "object" && e.objectProps && e.objectProps.length > 0) {
            addPasteHandler(e.objectProps, item[e.name], checkValidResults, e.name)
        } else {
            const handler = e.cfgPasteHandler
            if (handler) {
                const filedName = parentFieldName ? (parentFieldName + "-" + e.name) : e.name

                const f = (event: any) => doPaste(event, handler, e.name, item, checkValidResults)
                //https://developer.mozilla.org/zh-CN/docs/Web/API/Element/paste_event
                //
                //通过给ListInput指定onPaste属性不工作，像没添加一样，因F7不支持该属性，即使强行指定也不工作
                //改由原生js方式去绑定paste事件处理器: 当fieldMeta配置了pasteHandler时，设置好该控件id以及其handler，最终在useEffect中进行绑定
                //如果需要切换到强行修改F7属性，则配置useRawOnPaste=false
                document.querySelector("#" + filedName)?.addEventListener('paste', f);
                handles.push(handler)
            }
        }
    }
    return () => {
        for (let i = 0; i < handles.length; i++) {
            document.removeEventListener('paste', handles[i])
        }
    }
}

function initCheckValidResults<T>(itemValue: T, fields: FieldMeta<T>[], checkValidResults: {}, errMsgs: {}, parentFieldName?: string){
    for (let i = 0; i < fields.length; i++) {
        const e: FieldMeta<T> = fields[i]
        const filedName = parentFieldName ? (parentFieldName + "-" + e.name) : e.name

        if (e.type === "object" && e.objectProps && e.objectProps.length > 0) {
            initProps(itemValue[e.name], e.objectProps, checkValidResults, errMsgs, e.name)
        } else {
            if (e.required) {
                if (itemValue[e.name] || e.defaultValue)
                    checkValidResults[filedName] = true
                else
                    checkValidResults[filedName] = false
            } else {
                checkValidResults[filedName] = true
            }
        }  
    }
}

/**
 * 根据已经指定的属性，添加额外的属性，包括是否required，给label添加*，初始化validate的初始结果，并指定onValidate属性
 * @param fields 
 * @returns 
 */
function initProps<T>(itemValue: T, fields: FieldMeta<T>[], checkValidResults: {}, errMsgs: {}, parentFieldName?: string) {
    for (let i = 0; i < fields.length; i++) {
        const e: FieldMeta<T> = fields[i]
        if (e.type === "object" && e.objectProps && e.objectProps.length > 0) {
            initProps(itemValue[e.name], e.objectProps, checkValidResults, errMsgs, e.name)
        } else {
            const filedName = parentFieldName ? (parentFieldName + "-" + e.name) : e.name

            if (e.cfgPasteHandler) {
                e.id = filedName //paste handler用于selector
            }

            //require项加*号
            if (e.required) e.label += "*"

            //如果指定了validate，需要验证，则初始值指定为false，同时指定onValidate，更新valid结果
            if (e.validate) {
                e.onValidate = (isValid) => {
                    checkValidResults[filedName] = isValid
                    if (f7ProConfig.EnableLog) console.log(`filedName: ${filedName}.onValidate(${isValid})`)
                   // if (f7ProConfig.EnableLog) console.log(`${e.name}.onValidate(${isValid}), checkValidResults: ${JSON.stringify(checkValidResults)}`)
                }
                errMsgs[e.name] = "请检查：" + e.label + " ，" + e.errorMessage || "请检查：" + e.label
            }
        }
    }
}

const getInvalidKey = (results: {}) => {
    const keys = Object.keys(results);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        if (results[key] === false) {
            if (f7ProConfig.EnableLog) console.log("getInvalidKey:" + key + " is invalid")
            return key
        }
    }
    if (f7ProConfig.EnableLog) console.log("checkValid: all pass")
    return undefined
}

function save<T extends ItemBase>(item: Partial<T>, isAdd: boolean, pageProps: EditPageProps<T>, onSaveSuccess?: (() => void)) {
    const post = UseCacheConfig.request?.post
    if (!post) {
        console.warn("not config UseCacheConfig.request.post ?")
        return
    }

    fetchWithLoading<T>(
        () => post(pageProps.saveApi, item),
        (doc) => {

            f7.data.dirty = false
            //saveAdIntoStorage(ad, ad._id === undefined, id)
            const cacheKey = pageProps.cacheKey
            if (f7ProConfig.EnableLog) console.log("isAdd=" + isAdd)
            //CommonList中的新增和编辑时，均传递了isAdd值，各业务页面XXXEditPage中，若中继转发了该值，则使用它；
            //若不中继转发，则继续通过_id进行判断，目的是兼容旧的代码，以及多数情况下无需通过isAdd判断
            //只有新增时也有_id的情况，才通过isAdd方式来判断
            if (cacheKey) {
                if (isAdd === undefined) {//EditPage中未接收isAdd参数，未将isAdd传递过来
                    if (item[pageProps.key || UseCacheConfig.defaultIdentiyKey] === undefined) {//以XXX._id作为比较
                        //item._id = id
                        Cache.onAddOne(cacheKey, doc)
                    } else {
                        Cache.onEditOne(cacheKey, doc, pageProps.key)
                    }
                } else {
                    if (isAdd) {//以isAdd方式比较
                        Cache.onAddOne(cacheKey, doc)
                    } else {
                        Cache.onEditOne(cacheKey, doc, pageProps.key)
                    }
                }
            }

            f7.toast.show({ text: "保存成功" })

            if (onSaveSuccess) onSaveSuccess()

            //if (continueAdd)reset();else
            f7.views.main.router.back()
        })
}

/**
 * 
 * @param pageProps Page的属性
 * @param fields 输入项描述数组
 * @param originalItem 修改时的列表项值，新增时可能为空（除非指定了默认值或其它预置参数值）
 * @param listProps  F7的List组件的属性
 * @param isAdd 新增和编辑时修改list缓存，通过该方式进行区别，因为有些情况_id一直存在，不能通过_id是否为空来判断
 * @returns 返回一个编辑页面，并且支持修改后的保存
 */
export function CommonItemEditPage<T extends ItemBase>(
    pageProps: EditPageProps<T>,
    fields: FieldMeta<T>[],
    originalItem: Partial<T>,
    isAdd: boolean, //从列表页中传递过来的参数
    listProps?: ListProps,
    onSaveSuccess?: (() => void),
    TopView?: React.FC<{ originalItem?: Partial<T>, pageProps?: EditPageProps<T>, fields?: FieldMeta<T>[] }>,
    BottomView?: React.FC<{ originalItem?: Partial<T>, pageProps?: EditPageProps<T>, fields?: FieldMeta<T>[] }>
) {
   // const [item, setItem] = useState<Partial<T>>(originalItem)//修改某些值如texteditor中的值，会导致其它字段值丢失
   const [count, setCount] = useState(0)//用于重新刷新
    const itemRef = useRef<Partial<T>>(originalItem)
    const checkValidResultsRef = useRef({})
    const errMsgsRef = useRef({})


    initProps(itemRef.current, fields, checkValidResultsRef.current, errMsgsRef.current)

    useEffect(() => {
        document.title = (isAdd ? "新增" : "编辑") + pageProps.name
        initCheckValidResults(itemRef.current, fields, checkValidResultsRef.current, errMsgsRef.current)
        return addPasteHandler(fields, originalItem, checkValidResultsRef.current)
    }, [])

    const saveIfEdited = () => {
        if (!f7.data.dirty) {
            f7.toast.show({ text: "没有任何改动" })
            f7.views.main.router.back()
        }

        const validateInputs = f7.input.validateInputs("#" + pageProps.id)
        if (f7ProConfig.EnableLog) console.log("validateInputs=" + validateInputs)


        //未通过校验检查，则提示出错，阻止保存
        const invalidKey = getInvalidKey(checkValidResultsRef.current)
        if (invalidKey) {
            if (f7ProConfig.EnableLog){
                console.log("data=" + JSON.stringify(itemRef.current))
               // console.log("results=" + JSON.stringify(checkValidResults))
            }
            f7.dialog.alert(errMsgsRef.current[invalidKey] || "请检查带*的项是否为空，以及是否正确")
            return
        }

        //使用自定义save
        if (pageProps.saveCallback) {
            f7.data.dirty = false
            pageProps.saveCallback(itemRef.current)
        } else {
            save(itemRef.current, isAdd, pageProps, onSaveSuccess)
        }
    }

    const onValueChange= (newValue: any, e: FieldMeta<T>, sub?: FieldMeta<T>) => {
        if (f7ProConfig.EnableLog) console.log("onValueChange: newValue=" + newValue)
        
        const e2 = sub || e 
        const v = sub ? itemRef.current[e.name][sub.name] : itemRef.current[e.name]

        const initialValue = e2.handleIntialValue ? e2.handleIntialValue(v) : v
        if (newValue !== initialValue) {
            f7.data.dirty = true
            const v2 = e2.handleChangedValue ? e2.handleChangedValue(newValue) : newValue
            if(sub){
                itemRef.current[e.name][sub.name] = v2
            }else{
                itemRef.current[e.name] = v2
            }

            if (f7ProConfig.EnableLog)  console.log("setItemValue: "+ JSON.stringify(itemRef.current))
            //setItem({ ...item })
            setCount(count+1)
        }
    }

    if (f7ProConfig.EnableLog) console.log("render EditPage: item=" + JSON.stringify(itemRef.current))

    return <Page name={pageProps.id} id={pageProps.id} noNavbar={!pageProps.hasNavBar}>
        {pageProps.hasNavBar && <Navbar title={(isAdd ? "新增" : "编辑") + pageProps.name} backLink={f7ProConfig.TextBack} />}
        {TopView && <TopView originalItem={originalItem} pageProps={pageProps} fields={fields} />}
        <List {...listProps}>
            {fields.map((e, i) => FieldMetaToListInput(e, i, itemRef.current, onValueChange))}
        </List>
        {BottomView && <BottomView originalItem={originalItem} pageProps={pageProps} fields={fields} />}
        <Toolbar bottom>
            <Button />
            <Button large onClick={() => saveIfEdited()}>{pageProps.saveText || "保  存"}</Button>
            <Button />
        </Toolbar>
    </Page>

}
