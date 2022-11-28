import {
    Button, f7, Icon, List, ListItem, Navbar, Page, SwipeoutActions,
    SwipeoutButton, Toolbar
} from 'framework7-react';
import React, { useEffect, useRef } from 'react';

//https://www.npmjs.com/package/use-bus
import { Cache, fetchWithLoading, PaginationQueryBase, UseCacheConfig, useCacheList } from "@rwsbillyang/usecache";
import { ListProps } from 'framework7-react/components/list';
import { ListItemProps } from 'framework7-react/components/list-item';
import useBus, { dispatch } from 'use-bus';
import { LoadMore } from './components/LoadMore';
import { NoDataOrErr } from './components/NoDataOrErr';
import { SearchView } from './components/SearchView';
import { f7ProConfig } from './Config';
import { FieldMeta } from './datatype/FieldMeta';
import { ItemBase } from './datatype/ItemBase';
import { ListPageProps, SwipeItem } from './datatype/ListPageProps';



export function deleteOne<T extends ItemBase>(pageProps: ListPageProps<T>, item?: ItemBase) {
    const id = item ? item[pageProps.key || UseCacheConfig.defaultIdentiyKey] : undefined
    if (!id) {
        f7.dialog.alert("no id")
        console.warn("no id when del, please set pageProps.key or UseCacheConfig.defaultIdentiyKey")
        return
    }
    f7.dialog.confirm('删除后不能恢复，确定要删除吗？', () => {
        const get = UseCacheConfig.request?.get
        if (get) {
            fetchWithLoading<number>(
                () => get(pageProps.delApi + "/" + id),
                () => {
                    console.log("successfully del:" + id)
                    Cache.onDelOneById(pageProps.cacheKey, id)

                    dispatch("refreshList-" + pageProps.id) //删除完毕，发送refreshList，告知ListView去更新
                })
        }

    })
}

/**
 * 列表页，点击跳转时会附带上item，跳转链接的后面会附带上_id；编辑时也会附带上item，跳转链接中无_id, 新增时会附带上预置的字段值；删除时，delApi后直接添加id
 * 
 * @param pageProps Page页面属性，
 * @param listProps  F7的List组件的属性，如指定mediaList
 * @param listItemPropsFunc 用于构建ListItem中的属性，如title， subtitle，after，text，after等
 * @param initialValue 传入的初始数据，用于新增时将一些非编辑的其它参数传递进来。如新增公众号菜单时，需要将当前公众号appId传递进来 用Partial主要因为新增时大部分字段为空
 * @param initialQuery 列表查询条件 为空则表示未指定
 * @param listItemSlotViewFunc 如果ListItem的属性函数listItemPropsFunc不能满足要求，可以使用listItemSlotViewFunc指定slot，还不满足要求，可使用CustomListView
 * @param CustomListView 当<List>以及listItemPropsFunc和listItemSlotViewFunc不能满足要求时，自行提供一个List
 * @param MyNavBar 自定义NavBar，额外的操作菜单
 * @param addMax 新增次数限制
 * @param searchFields 需要搜索时，传递过来的搜索字段
 * @returns 返回具备LoadMore的列表页面,支持修改或删除后对缓存的刷新
 */
//export const CommonListPage: React.FC<{listProps: ListPageProps, titleFunc:(e: T)=>string, initialQuery?: Q}> = ({listProps, titleFunc, initialQuery}) => {
export function CommonListPage<T extends ItemBase, Q extends PaginationQueryBase>
    (
        pageProps: ListPageProps<T>,
        listProps?: ListProps,
        listItemPropsFunc?: (e: T) => ListItemProps,
        initialValue?: Partial<T>,
        initialQuery?: Q,
        listItemSlotViewFunc?: (e: T, pageProps: ListPageProps<T>) => JSX.Element,
        CustomListView?: React.FC<{ list: T[], pageProps: ListPageProps<T> }>,
        MyNavBar?: React.FC<{ pageProps: ListPageProps<T>, initialValue?: Partial<T> }>,
        addMax?: number,
        searchFields?: FieldMeta<T>[],
    ) {

    // let currentQuery: Q = { ...initialQuery } as Q
    //如果指定了存储，则试图从localStorage中加载
    //if (pageProps.initalQueryKey) {
    const initalQueryKey = pageProps.cacheKey + "/initialQuery"
    // const v = CacheStorage.getItem(initalQueryKey, StorageType.OnlySessionStorage)
    // if (v) currentQuery = JSON.parse(v) || initialQuery
    //}
    const { current } = useRef({ query: initialQuery })

    const { isLoading, isError, errMsg, loadMoreState, setQuery, list, setRefresh, setUseCache, setIsLoadMore }
        = useCacheList<T, Q>(pageProps.listApi, pageProps.cacheKey, current.query, pageProps.needLoadMore === false ? false : true)

    if (f7ProConfig.EnableLog) console.log("CommonListPage: currentQuery=" + JSON.stringify(current.query))

    //从缓存中刷新
    useBus('refreshList-' + pageProps.id, () => setRefresh())

    //修改后重新加载数据, 因为需要刷新数据，故没有将List提取出来作为单独的component
    const pageReInit = () => {
        //console.log("pageReInit, refresh=" + refresh)
        setRefresh()
        document.title = pageProps.name + "列表"
    }
    useEffect(() => {
        document.title = pageProps.name + "列表"
    }, [])


    const defaultListItemPropsFunc = (itemValue: T) => {
        const props: ListItemProps = {
            title: itemValue["name"] || itemValue["_id"],
            swipeout: !!pageProps.editPath || !!pageProps.delApi || (pageProps.swipeItemsLeft && pageProps.swipeItemsLeft.length > 0) || (pageProps.swipeItemsRight && pageProps.swipeItemsRight.length > 0),
            routeProps: { item: itemValue },
        }
        return props
    }

    const swipeoutSlotFunc = (itemValue: T, pageProps: ListPageProps<T>) => {
        const editable = pageProps.editPath
        const swipeout = !!editable || !!pageProps.delApi || (pageProps.swipeItemsLeft && pageProps.swipeItemsLeft.length > 0) || (pageProps.swipeItemsRight && pageProps.swipeItemsRight.length > 0)

        if (!swipeout) return null

        let leftArry: SwipeItem[] = []

        if (editable) {
            leftArry.push({ name: "编辑", color: "yellow", onClick: () => { f7.views.main.router.navigate(editable(itemValue), { props: { item: itemValue, isAdd: "0" } }) } })
        }
        if (pageProps.delApi) {
            leftArry.push({ name: "删除", color: "red", onClick: () => { deleteOne(pageProps, itemValue) } })
        }
        if (pageProps.swipeItemsLeft && pageProps.swipeItemsLeft.length > 0) {
            leftArry = leftArry.concat(pageProps.swipeItemsLeft)
        }

        const rightArry = pageProps.swipeItemsRight || []

        return  <>
                {leftArry.map((e, i) =>
                    <SwipeoutActions left key={"left-" + i}>
                        <SwipeoutButton color={e.color} close onClick={e.onClick}>{e.name}</SwipeoutButton>
                    </SwipeoutActions>)
                }
                {
                    rightArry.map((e, i) =>
                        <SwipeoutActions left key={"right-" + i}>
                            <SwipeoutButton color={e.color} close onClick={e.onClick}>{e.name}</SwipeoutButton>
                        </SwipeoutActions>)
                }
            </>
           

    }


    const itemPropsFunc = listItemPropsFunc || defaultListItemPropsFunc
    const itemSlotFunc = listItemSlotViewFunc || swipeoutSlotFunc



    return <Page name={pageProps.id} id={pageProps.id}
        noNavbar={!pageProps.hasNavBar}
        stacked={false}
        onPageReinit={pageReInit}
    >
        {pageProps.hasNavBar && (MyNavBar ? <MyNavBar pageProps={pageProps} initialValue={initialValue} /> : <Navbar title={pageProps.name} backLink={pageProps.noBackLink ? undefined : f7ProConfig.TextBack} />)}

        {
            (searchFields && searchFields.length > 0) && SearchView(searchFields, setUseCache, setQuery, initialQuery, current.query, initalQueryKey)
        }

        {
            (list && list.length > 0) ?
                <>
                    {CustomListView ? <CustomListView list={list} pageProps={pageProps} />
                        : <List {...listProps}>
                            {list?.map((e: T, i: number) => {
                                return <ListItem key={i} {...itemPropsFunc(e)}>
                                    {itemSlotFunc(e, pageProps)}
                                </ListItem>
                            })}
                            {(pageProps.delApi || pageProps.editPath) && <div slot="after-list" style={{ fontSize: "12px", color: "gray", textAlign: "center" }}>向左滑动列表可编辑或删除 </div>}
                        </List>}
                    {pageProps.needLoadMore !== false && <LoadMore
                        loadMoreState={loadMoreState}
                        isLoading={isLoading}
                        isError={isError}
                        errMsg={errMsg}
                        loadMore={() => {
                            setUseCache(false)
                            setIsLoadMore(true)
                            //排序时，若指定了sortKey则使用指定的，否则默认使用_id
                            const sortKey = (current.query?.pagination?.sKey) ? current.query.pagination.sKey : "_id"
                            const lastValue = list[list.length - 1][sortKey] + "" //转换为字符串
                            if (current.query?.pagination)
                                current.query.pagination.lastId = lastValue
                            else {
                                if (current.query) {
                                    current.query.pagination = { lastId: lastValue }
                                } else {
                                    const q: PaginationQueryBase = { pagination: { lastId: lastValue } }
                                    current.query = q as Q
                                }
                            }
                        }
                        }
                    />}
                </>
                : <NoDataOrErr isLoading={isLoading} isError={isError} errMsg={errMsg} />
        }
        {
            pageProps.editPath &&
            <Toolbar bottom>
                <Button />
                <Button large disabled={addMax !== undefined && list && list.length >= addMax} href={pageProps.editPath ? pageProps.editPath(initialValue || {}) : undefined} routeProps={{ isAdd: "1", item: initialValue }}><Icon f7="plus" />{"新增" + pageProps.name}</Button>
                <Button />
            </Toolbar>
        }

    </Page >
}
