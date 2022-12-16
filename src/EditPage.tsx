import React, { SyntheticEvent, useEffect, useState } from 'react';
import {
    Page,
    Button,
    Toolbar,
    Navbar,
    ListItem,
    f7,
    List,
    ListInput,
    Toggle
} from 'framework7-react';


import { Cache, fetchWithLoading, UseCacheConfig } from "@rwsbillyang/usecache";
import { FieldMeta } from './datatype/FieldMeta';
import { ItemBase } from './datatype/ItemBase';
import { EditPageProps } from './datatype/EditPageProps';
import { ListProps } from 'framework7-react/components/list';
import { SelectOption } from './datatype/SelectOption';
import { AsynSelectInput } from "./components/AsyncSelectInput";
import { f7ProConfig } from './Config';



function initValidResultsAndCfgPasteHandler<T>(results: {}, errMsgs: {}, pasteHandlerConfig: {}, fields: FieldMeta<T>[], itemValue: T) {
    for (let i = 0; i < fields.length; i++) {
        const e: FieldMeta<T> = fields[i]
        if (e.type === "object") {
            if (e.objectProps) {
                for (let j = 0; j < e.objectProps.length; j++) {
                    const sub = e.objectProps[j]
                    //如果指定了需要验证，则初始值指定为false，同时指定onValidate，更新valid结果
                    if (sub.validate || e.required) {
                        if (sub.type === 'asyncSelect') {//因为不采用onValidate，故在编辑时若有值，也不会调用onChange导致初始值为false
                            if (itemValue[e.name][sub.name].value || sub.defaultValue)
                                results[e.name + "-" + sub.name] = true
                            else
                                results[e.name + "-" + sub.name] = false
                        } else
                            results[e.name + "-" + sub.name] = false
                        errMsgs[e.name + "-" + sub.name] = "请检查：" + e.label + "-" + sub.label + "：" + sub.errorMessage || "请检查：" + e.label + "." + sub.label
                    }

                    if (sub.cfgPasteHandler) {
                        const key = sub.type === 'textarea' ? `textarea[name='${e.name + "-" + sub.name}']` : `input[name='${e.name + "-" + sub.name}']`
                        pasteHandlerConfig[key] = sub.cfgPasteHandler
                        if(f7ProConfig.EnableLog) console.log("add sub cfgPasteHandler for " + key)
                    }
                }
            }
        } else {
            //如果指定了需要验证，则初始值指定为false，同时指定onValidate，更新valid结果
            if (e.validate) {
                if (e.type === 'asyncSelect') {//因为不采用onValidate，故在编辑时若有值，也不会调用onChange导致初始值为false
                    if (itemValue[e.name] || e.defaultValue)
                        results[e.name] = true
                    else
                        results[e.name] = false
                } else
                    results[e.name] = false
                errMsgs[e.name] = "请检查：" + e.label + " ，" + e.errorMessage || "请检查：" + e.label
            }

            if (e.cfgPasteHandler) {
                const key = e.type === 'textarea' ? `textarea[name='${e.name}']` : `input[name='${e.name}']`
                pasteHandlerConfig[key] = e.cfgPasteHandler
                if(f7ProConfig.EnableLog)  console.log("add cfgPasteHandler for " + key)
            }
        }
    }
}
const getInvalidKey = (results: {}) => {
    const keys = Object.keys(results);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        if (results[key] === false) {
            if(f7ProConfig.EnableLog) console.log(key + " is invalid")
            return key
        }
    }
    if(f7ProConfig.EnableLog) console.log("checkValid: all pass")
    return undefined
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
    const [item, setItem] = useState({ ...originalItem })
    const [textDirty, setTextDirty] = useState(false)

    const [checkValidResults, setCheckValidResults] = useState({})//存放校验结果，如果提供了validate，则用于存放onValidate的校验结果，任何一个为false则保存时不能通过
    const [errMsgs, setErrMsgs] = useState({}) //存储校验错误提示信息

    //通过给ListInput指定onPaste属性不工作，像没添加一样，因F7不支持该属性，即使强行指定也不工作
    //改由原生js方式去绑定paste事件处理器: 当fieldMeta配置了pasteHandler时，设置好该控件id以及其handler，最终在useEffect中进行绑定
    //如果需要切换到强行修改F7属性，则配置useRawOnPaste=false
    const useRawOnPaste = true
    const [pasteHandlerConfig] = useState({}) //当useRawOnPaste == true时使用 


    //处理event，并调用配置的onPasteHandler进行处理
    function doPaste<T>(event: React.ClipboardEvent<HTMLTextAreaElement>, cfgPasteHandler: (text: string) => Partial<T>, key: string) {
        // event.currentTarget.style.border = "5px solid purple";
        // event.currentTarget.style.backgroundColor = "orange";

        const text = event.clipboardData.getData("text")
        //console.log("clipboardData: " + text);

        // Transform the copied/cut text to upper case
        //event.currentTarget.value = event.clipboardData.getData("text").toUpperCase();
        const part = cfgPasteHandler(text)
        const keys = Object.keys(part)

        if (keys.length === 0) {
            setItem({ ...item, key: text })
            checkValidResults[key] = true
        } else {
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i]
                //TODO: 调用pattern检查合法性
                if (part[key]) checkValidResults[key] = true
                //f7.input.checkEmptyState(key)
            }
            setItem({ ...item, ...part }) //不会调用onChange，从而校验结果得不到更新，上面手工检查结果
        }


        event.preventDefault();
    }

    //initProps会根据是否存在cfgPasteHandler，初始化pasteHandlerConfig，然后useEffect会调用initCfgPasteHandlers进行paste事件绑定
    const addPasteEventListeners = () => {
        const keys = Object.keys(pasteHandlerConfig);
        if(f7ProConfig.EnableLog) console.log("initCfgPasteHandlers: " + JSON.stringify(keys))
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]
            //https://developer.mozilla.org/zh-CN/docs/Web/API/Element/paste_event
            document.querySelector(key)?.addEventListener('paste', (event: any) => doPaste(event, pasteHandlerConfig[key], key));
        }
    }

    /**
     * 根据已经指定的属性，添加额外的属性，包括是否required，给label添加*，初始化validate的初始结果，并指定onValidate属性
     * @param fields 
     * @returns 
     */
    function initProps<T>(results: {}, fields: FieldMeta<T>[]) {

        for (let i = 0; i < fields.length; i++) {
            const e: FieldMeta<T> = fields[i]
            if (e.type === "object") {
                if (e.objectProps) {
                    for (let j = 0; j < e.objectProps.length; j++) {
                        const sub = e.objectProps[j]

                        //require项加*号
                        if (sub.required) sub.label += "*"

                        //如果指定了validate，需要验证，则初始值指定为false，同时指定onValidate，更新valid结果
                        if (sub.validate) {
                            e.onValidate = (isValid) => results[e.name + "-" + sub.name] = isValid
                        }

                        //onPaste事件处理: 不工作，像没添加一样，F7不支持该属性，改由原生js方式去绑定paste事件处理器
                        if (sub.cfgPasteHandler && !useRawOnPaste) {
                            const cfgPasteHandler = sub.cfgPasteHandler
                            //为field指定onPaste属性
                            sub.onPaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => doPaste(event, cfgPasteHandler, sub.name)
                        }
                    }
                }
            } else {
                //require项加*号
                if (e.required) e.label += "*"

                //如果指定了validate，需要验证，则初始值指定为false，同时指定onValidate，更新valid结果
                if (e.validate) {
                    e.onValidate = (isValid) => {
                        if(f7ProConfig.EnableLog) console.log(e.name + ": onValidate is called to set: " + isValid)
                        results[e.name] = isValid
                    }
                }

                if (e.cfgPasteHandler && !useRawOnPaste) {
                    const cfgPasteHandler = e.cfgPasteHandler
                    //onPaste事件处理: 不工作，像没添加一样，F7不支持该属性，改由原生js方式去绑定paste事件处理器
                    e.onPaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => doPaste(event, cfgPasteHandler, e.name)
                }

            }
        }
    }


    const reset = () => {
        if(f7ProConfig.EnableLog) console.log("after reset, restore to originalItem=" + JSON.stringify(originalItem))
        setItem(originalItem)
        setCheckValidResults({})
        setErrMsgs({})
        initValidResultsAndCfgPasteHandler({}, {}, pasteHandlerConfig, fields, originalItem)
    }

    initProps(checkValidResults, fields)

    useEffect(() => {
        initValidResultsAndCfgPasteHandler(checkValidResults, errMsgs, pasteHandlerConfig, fields, item)
        addPasteEventListeners()
        document.title = (isAdd? "新增": "编辑") + pageProps.name
    }, [])

    const saveIfEdited = (continueAdd: boolean) => {
        if (textDirty) {
            const validateInputs = f7.input.validateInputs("#" + pageProps.id)
            if(f7ProConfig.EnableLog) console.log("validateInputs=" + validateInputs)


            //未通过校验检查，则提示出错，阻止保存
            const invalidKey = getInvalidKey(checkValidResults)
            if (invalidKey) {
                if(f7ProConfig.EnableLog) console.log("data=" + JSON.stringify(item) + ", results=" + JSON.stringify(checkValidResults))
                f7.dialog.alert(errMsgs[invalidKey] || "请检查带*的项是否为空，以及是否正确")
                return
            }

            //使用自定义save
            if (pageProps.saveCallback) {
                setTextDirty(false);
                f7.data.dirty = false
                pageProps.saveCallback(item)
            } else {

                const post = UseCacheConfig.request?.post
                if (post) {
                    fetchWithLoading<T>(
                        () => post(pageProps.saveApi, item),
                        (doc) => {
                            setTextDirty(false);
                            f7.data.dirty = false
                            //saveAdIntoStorage(ad, ad._id === undefined, id)
                            const cacheKey = pageProps.cacheKey
                            if(f7ProConfig.EnableLog) console.log("isAdd=" + isAdd)
                            //CommonList中的新增和编辑时，均传递了isAdd值，各业务页面XXXEditPage中，若中继转发了该值，则使用它；
                            //若不中继转发，则继续通过_id进行判断，目的是兼容旧的代码，以及多数情况下无需通过isAdd判断
                            //只有新增时也有_id的情况，才通过isAdd方式来判断
                            if(cacheKey){
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

                            if (continueAdd) {
                                reset()
                            } else
                                f7.views.main.router.back()
                        })
                } else {
                    console.warn("not config UseCacheConfig.request.post ?")
                }

            }
        } else {
            f7.toast.show({ text: "没有任何改动" })
            f7.views.main.router.back()
        }
    }



    const metaToListInput = (e: FieldMeta<T>, i: number, itemValue: Partial<T>): JSX.Element | null => {
        const isDisplay = !e.depend || (e.depend && e.depend(itemValue))
        //console.log("label="+e.label + ", isDisplay="+isDisplay + ",itemValue="+JSON.stringify(itemValue))
        const initialValue = e.handleIntialValue? e.handleIntialValue(itemValue[e.name]) : itemValue[e.name]
        switch (e.type) {
            case "switch":
            case "toggle":
                return isDisplay ? <ListItem key={i}>
                    <span>{e.label}</span>
                    <Toggle checked={initialValue}
                        onToggleChange={(v: boolean) => {
                            setTextDirty(true)
                            f7.data.dirty = true
                            itemValue[e.name] = e.handleChangedValue? e.handleChangedValue(v) : v
                            setItem({ ...itemValue })
                        }} ></Toggle>
                </ListItem> : null
            case 'object': //TODO: add ui offset or frame order
                return (isDisplay && e.objectProps && e.objectProps.length > 0) 
                ? <>{e.objectProps.map((subMeta: FieldMeta<T>, j) => metaToListInput(subMeta, i*100+j, itemValue[e.name] || {}))}</>
                 : null
            case 'asyncSelect':
                return isDisplay ? AsynSelectInput({ ...e, value: initialValue }, (newValue?: string | number) => {
                    if (e.required && !newValue) {
                        console.log("asyncSelect directly set " + e.name + " false")
                        checkValidResults[e.name] = false //bugfix patch for F7: 没有调用onValidate, 手工指定
                    } else {
                        console.log("asyncSelect directly set " + e.name + " true")
                        checkValidResults[e.name] = true //bugfix patch for F7:  没有调用onValidate, 手工指定
                    }

                    if (initialValue !== newValue) {
                        setTextDirty(true)
                        f7.data.dirty = true
                        itemValue[e.name] = e.handleChangedValue? e.handleChangedValue(newValue): newValue
                        setItem({ ...itemValue })
                    }
                }, e.asyncSelectProps): null
            case 'datepicker':
                return isDisplay ? <ListInput key={i}
                    {...e}
                    value={initialValue||""}
                    onCalendarChange={(newValue) => {
                        if (newValue) {
                            if (e.validate) checkValidResults[e.name] = true
                            if (initialValue !== newValue) {
                                setTextDirty(true)
                                f7.data.dirty = true
                                itemValue[e.name] = e.handleChangedValue? e.handleChangedValue(newValue): newValue
                                setItem({ ...itemValue })
                            }
                        } else {
                            if (e.validate) checkValidResults[e.name] = false

                            if (itemValue[e.name]) {
                                setTextDirty(true)
                                f7.data.dirty = true
                                itemValue[e.name] = e.handleChangedValue? e.handleChangedValue(undefined): undefined
                                setItem({ ...itemValue })
                            }
                        }
                    }}
                /> : null
                case 'colorpicker':
                    return isDisplay ? <ListInput key={i}
                        {...e}
                        value={{ hex: initialValue }}
                        onColorPickerChange={(newValue) => {
                            if (newValue.hex) {
                                if (e.validate) checkValidResults[e.name] = true  
                                if (initialValue !== newValue.hex) {
                                    setTextDirty(true)
                                    f7.data.dirty = true
                                    itemValue[e.name] = e.handleChangedValue? e.handleChangedValue(newValue.hex): newValue.hex
                                    setItem({ ...itemValue })
                                }
                            } else {
                                if (e.validate) checkValidResults[e.name] = false   
                                if (itemValue[e.name]) {
                                    setTextDirty(true)
                                    f7.data.dirty = true
                                    itemValue[e.name] = e.handleChangedValue? e.handleChangedValue(undefined): undefined
                                    setItem({ ...itemValue })
                                }
                            }
                        }}
                    /> : null    
            case 'texteditor':
                return isDisplay ? <ListInput key={i}
                    {...e}
                    value={initialValue||""}
                    onTextEditorChange={(newValue) => {
                        if (itemValue[e.name] !== newValue) {
                            setTextDirty(true)
                            f7.data.dirty = true
                            itemValue[e.name] = e.handleChangedValue? e.handleChangedValue(newValue): newValue
                            setItem({ ...itemValue })
                        }
                    }}
                />: null
            default:
                return isDisplay ? <ListInput key={i}
                    {...e}
                    value={initialValue||""}
                    onChange={(event: SyntheticEvent) => {
                        const target = event.target as HTMLInputElement
                        const newValue = target.value

                        if (itemValue[e.name] !== newValue) {
                            setTextDirty(true)
                            f7.data.dirty = true
                            itemValue[e.name] = e.handleChangedValue? e.handleChangedValue(newValue): newValue
                            setItem({ ...itemValue })
                        }
                    }}
                    onInputClear={() => {
                        if (itemValue[e.name]) {
                            setTextDirty(true)
                            f7.data.dirty = true
                            itemValue[e.name] = e.handleChangedValue? e.handleChangedValue(undefined): undefined
                            setItem({ ...itemValue })
                        }
                    }}
                >
                    {e.type === 'select' && e.selectOptions?.map((option: SelectOption, i: number) => <option key={i} value={option.value === undefined ? option.label : option.value}>{option.label}</option>)}
                </ListInput> : null
        }
    }

    return <Page name={pageProps.id} id={pageProps.id} noNavbar={!pageProps.hasNavBar}>
        {pageProps.hasNavBar && <Navbar title={(isAdd? "新增": "编辑")  + pageProps.name} backLink={f7ProConfig.TextBack} />}
        {TopView && <TopView originalItem={originalItem} pageProps={pageProps} fields={fields} />}
        <List {...listProps}>
            {fields.map((e, i) => metaToListInput(e, i, item))}
        </List>
        {BottomView && <BottomView originalItem={originalItem} pageProps={pageProps} fields={fields} />}
        <Toolbar bottom>
            <Button />
            <Button large onClick={() => saveIfEdited(false)}>{pageProps.saveText || "保  存"}</Button>
            <Button />
        </Toolbar>
    </Page>

}