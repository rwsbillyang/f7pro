
import {
    ListInput, ListItem, Toggle
} from 'framework7-react';
import React, { SyntheticEvent } from 'react';
import { FieldMeta } from './datatype/FieldMeta';
import { ItemBase } from './datatype/ItemBase';
import AsynSelectInput from './components/AsyncSelectInput'
import { SelectOption } from './datatype/SelectOption';


export const FieldMetaToListInput = <T extends ItemBase>(e: FieldMeta<T>, i: number, itemValue: Partial<T>,
    onValueChange: (newValue: any, e: FieldMeta<T>, sub?: FieldMeta<T>) => void): JSX.Element | null => {

    const isDisplay = !e.depend || (e.depend && e.depend(itemValue))
    if (!isDisplay) return null

    const initialValue = e.handleIntialValue ? e.handleIntialValue(itemValue[e.name]) : itemValue[e.name]
    switch (e.type) {
        case "switch":
        case "toggle":
            return <ListItem key={i}>
                <span>{e.label}</span>
                <Toggle checked={initialValue || false}
                    onToggleChange={(v: boolean) => {
                        onValueChange(v, e)
                    }} ></Toggle>
            </ListItem>

        case 'asyncSelect':
            return AsynSelectInput({ ...e, value: initialValue }, (newValue?: string | number) => {
                onValueChange(newValue, e)
            }, i, e.asyncSelectProps)

        case 'datepicker':
            return <ListInput key={i}
                {...e}
                value={initialValue || ""}
                onCalendarChange={(newValue) => {
                    onValueChange(newValue, e)
                }}
            />
        case 'colorpicker':
            return <ListInput key={i}
                {...e}
                value={initialValue ? { hex: initialValue } : ''}
                onColorPickerChange={(newValue) => {
                    onValueChange(newValue.hex, e)
                }}
            />
        case 'texteditor':
            return <ListInput key={i}
                {...e}
                value={initialValue || ""}
                onTextEditorChange={(newValue) => {
                    onValueChange(newValue, e)
                }}
            />
        case 'object': //TODO: add ui offset or frame order
            return (e.objectProps && e.objectProps.length > 0)
                ? <>{e.objectProps.map((subMeta: FieldMeta<T>, j) => FieldMetaToListInput(subMeta, i * 100 + j, itemValue[e.name] || {},
                    (newValue: any, e: FieldMeta<T>) => {
                        onValueChange(newValue, e, subMeta)
                    }))}</>
                : null

        default:
            return <ListInput key={i}
                {...e}
                value={initialValue || ""}
                onChange={(event: SyntheticEvent) => {
                    const target = event.target as HTMLInputElement
                    onValueChange(target.value, e)
                }}
                onInputClear={() => {
                    onValueChange(undefined, e)
                }}
            >
                {e.type === 'select' && e.selectOptions?.map((option: SelectOption, i: number) => <option key={i} value={option.value === undefined ? option.label : option.value}>{option.label}</option>)}
            </ListInput>
    }
}
