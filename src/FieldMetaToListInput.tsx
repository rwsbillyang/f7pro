
import {
    ListInput, ListItem, Toggle
} from 'framework7-react';
import React, { SyntheticEvent } from 'react';
import { FieldMeta } from './datatype/FieldMeta';
import AsynSelectInput from './components/AsyncSelectInput'
import { SelectOption } from './datatype/SelectOption';


//因为存在递归调用，子meta不一定就是T extends ItemBase类型
export const FieldMetaToListInput = (objectMeta: FieldMeta, i: number, objectValue: Partial<object>,
    onValueChange: (objectMeta: FieldMeta, newValue: any, objectValue: Partial<object>) => void): JSX.Element | (JSX.Element | null)[] | null=> {

    const isDisplay = !objectMeta.depend || (objectMeta.depend && objectMeta.depend(objectValue))
    if (!isDisplay) return null

    const initialValue = objectMeta.handleIntialValue ? objectMeta.handleIntialValue(objectValue[objectMeta.name]) : objectValue[objectMeta.name]
    switch (objectMeta.type) {
        case "switch":
        case "toggle":
            return <ListItem key={i}>
                <span>{objectMeta.label}</span>
                <Toggle checked={initialValue || false}
                    onToggleChange={(v: boolean) => {
                        onValueChange(objectMeta, v, objectValue)
                    }} ></Toggle>
            </ListItem>

        case 'asyncSelect':
            return AsynSelectInput({ ...objectMeta, value: initialValue }, i, (newValue?: string | number) => {
                onValueChange(objectMeta, newValue, objectValue)
            }, objectMeta.asyncSelectProps)

        case 'datepicker':
            return <ListInput key={i}
                {...objectMeta}
                value={initialValue || ""}
                onCalendarChange={(newValue) => {
                    onValueChange(objectMeta, newValue, objectValue)
                }}
            />
        case 'colorpicker':
            return <ListInput key={i}
                {...objectMeta}
                value={initialValue ? { hex: initialValue } : ''}
                onColorPickerChange={(newValue) => {
                    onValueChange(objectMeta, newValue, objectValue)
                }}
            />
        case 'texteditor':
            return <ListInput key={i}
                {...objectMeta}
                value={initialValue || ""}
                onTextEditorChange={(newValue) => {
                    onValueChange(objectMeta, newValue, objectValue)
                }}
            />
        case 'object': //TODO: add ui offset or frame order.  return ListInput array
            if(objectMeta.objectProps && objectMeta.objectProps.length > 0){
                if(!objectValue[objectMeta.name]) objectValue[objectMeta.name] = {}
                return objectMeta.objectProps.flatMap((m2: FieldMeta, j) => FieldMetaToListInput(
                    m2,  i * 100 + j, objectValue[objectMeta.name], 

                    //m2 and objectValue[objectMeta.name]将作为实参传递过来,参见非object的onValueChange实参来源
                    (subMeta: FieldMeta, newValue: any, subObjValue: Partial<object>) => {
                        onValueChange(subMeta, newValue, subObjValue)
                    }))
            }else{
                return null
            }

        default:
            return <ListInput key={i}
                {...objectMeta}
                value={initialValue || ""}
                onChange={(event: SyntheticEvent) => {
                    const target = event.target as HTMLInputElement
                    onValueChange(objectMeta, target.value, objectValue)
                }}
                onInputClear={() => {
                    onValueChange(objectMeta, undefined, objectValue)
                }}
            >
                {objectMeta.type === 'select' && objectMeta.selectOptions?.map((option: SelectOption, i: number) => <option key={i} value={option.value === undefined ? option.label : option.value}>{option.label}</option>)}
            </ListInput>
    }
}
