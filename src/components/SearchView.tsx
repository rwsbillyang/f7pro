import {
    Button, Card, CardContent, CardFooter, Link, List, ListInput, ListItem, Toggle
} from 'framework7-react';
import React, { SyntheticEvent } from 'react';


import { PaginationQueryBase } from "@rwsbillyang/usecache";

import { dispatch } from 'use-bus';
import { AsynSelectInput } from './AsyncSelectInput';

import { FieldMeta } from '../datatype/FieldMeta';
import { ItemBase } from "../datatype/ItemBase";
import { SelectOption, SortOption } from '../datatype/SelectOption';

//https://stackoverflow.com/questions/53958028/how-to-use-generics-in-props-in-react-in-a-functional-component
//initalQueryShortKey = pageProps.cacheKey+pageProps.initalQueryKey
//export function useSearchView<T extends ItemBase, Q extends PaginationQueryBase>
// (
//     searchKFields: FieldMeta<T>[], 
//     setQuery: React.Dispatch<React.SetStateAction<Q | undefined>>,
//     initalQuery?: Q
//     )
// {
/**
 * 
 * @param searchFields 指定的哪些字段可搜索
 * @param setQuery 当搜索时，设置query，触发从远程查询
 * @param initalQuery 用于重置
 * @param currentQuery 当前查询条件
 * @param initalQueryShortKey 若给定了缓存键，则缓存搜索条件
 * @returns 
 */
export const SearchView = <T extends ItemBase, Q extends PaginationQueryBase>(
    searchFields: FieldMeta<T>[],
    queryRef: Q,
    onValueChanged: ()=>void) => {

    const metaToInput = (e: FieldMeta<T>, i: number) => {
        e.required = false
        e.errorMessage = undefined
        //console.log("label="+e.label + ", isDisplay="+isDisplay + ",item="+JSON.stringify(item))
        switch (e.type) {
            case 'object':
                return null
            case 'datepicker':
                return null
            case "radio":
                return <ListItem key={i}>
                    <span>{e.label}</span>
                    <Toggle checked={queryRef[e.name]}
                        onToggleChange={(newValue: boolean) => {
                            if (queryRef[e.name] !== newValue) {
                                queryRef[e.name] = newValue

                                onValueChanged()
                            }

                        }} ></Toggle>
                </ListItem>
            case 'asyncSelect':
                return AsynSelectInput({ ...e, value: queryRef[e.name] },
                    (newValue?: string | number) => {
                        if (queryRef[e.name] !== newValue) {
                            queryRef[e.name] = newValue
                            
                            onValueChanged()
                        }
                    }, e.asyncSelectProps)
            case 'sort':
                e.type = "select"
                return e.sortOptions ? <ListInput key={i}
                    {...e}
                    value={queryRef[e.name] || ''}
                    onChange={(event: SyntheticEvent) => {
                        const target = event.target as HTMLInputElement
                        const newValue = target.value

                        if (queryRef[e.name] !== newValue) {
                            console.log("newValue=" + newValue)
                            queryRef[e.name] = newValue

                            //如果值有改变，则重置lastId
                            onValueChanged()
                            //   setSearchQuery({ ...searchQuery, pagination: pagination }) //使用value值，则需重置state
                        }
                    }}
                > {e.sortOptions?.map((option: SortOption, i: number) => <option key={i} value={option.pagination?.sKey}>{option.label}</option>)}
                </ListInput> : null
            default:
                // if(e.type !== 'select') e.clearButton = true

                return <ListInput key={i}
                    {...e}
                    //defaultValue={searchQuery[e.name] || ''}
                    value={queryRef[e.name] || ''}
                    onChange={(event: SyntheticEvent) => {
                        const target = event.target as HTMLInputElement
                        const newValue = target.value.trim()

                        if (queryRef[e.name] !== newValue) {
                            console.log("newValue=" + newValue)
                            queryRef[e.name] = newValue
                            
                            //如果值有改变，则重置lastId
                            onValueChanged()
                        }
                    }}
                    onInputClear={() => {
                        if (queryRef[e.name]) { //第一次点击clear button时只是获取焦点，但此回调也会被回调，故不能使用此判断，或直接去掉clear button
                            console.log("onInputClear takes effect, searchQuery[e.name] is cleared")
                            queryRef[e.name] = undefined

                            //如果值有改变，则重置lastId
                            onValueChanged()
                        }

                    }}
                >
                    {e.type === 'select' && e.selectOptions?.map((option: SelectOption, i: number) => <option key={i} selected={queryRef[e.name] === option.value} value={option.value === undefined ? option.label : option.value}>{option.label}</option>)}
                </ListInput>
        }
    }


    return (
        <Card>
            <CardContent padding={false}>
                <List inlineLabels noHairlinesMd>
                    {
                        searchFields.map(metaToInput)
                    }
                </List>
            </CardContent>
            <CardFooter >
                <Link onClick={() => {
                   dispatch("searchReset")
                }}>重置</Link>

                <Button onClick={() => {
                    dispatch("search")
                }}>搜索</Button>

            </CardFooter>
        </Card>
    )
}