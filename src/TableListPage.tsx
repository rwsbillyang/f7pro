import { Block, Button, f7, Icon, Link, List, ListItem, Navbar, NavRight, Page, Popover, Toolbar } from 'framework7-react';
import React, { useEffect, useRef } from 'react';

import { Cache, CacheStorage, PaginationQueryBase, StorageType, useCacheList } from "@rwsbillyang/usecache";
import useBus from 'use-bus';
import { LoadMore } from './components/LoadMore';
import { NoDataOrErr } from './components/NoDataOrErr';
import { SearchView } from './components/SearchView';
import { f7ProConfig } from './Config';
import { FieldMeta } from './datatype/FieldMeta';
import { ItemBase } from './datatype/ItemBase';
import { ListPageProps } from './datatype/ListPageProps';
import { OperationCallback } from './datatype/OperationCallback';
import { TableCell } from './datatype/TableCell';






//批量操作，先选择后批量操作
export const TableList = <T extends ItemBase>(header: TableCell<T>[], data?: T[], operations?: OperationCallback<T>[]) => {

    return <div className="data-table"><table>
        <thead>
            <tr>
                {header.map((c) => <th className={c.className}>{c.label}</th>)}
                <th className="label-cell">操作</th>
            </tr>
        </thead>
        <tbody>
            {
                data?.map((e) => <tr>
                    {header.map((c) => <td className={c.className}>{c.cellValue(e)}</td>)}
                    <td className="label-cell"> {operations?.map((e2) => <Button onClick={() => {
                        if (e2.needConfirm === true)
                            f7.dialog.confirm(e2.confirmTip || '确定要操作吗？', () => e2.callback(e))
                        else e2.callback(e)
                    }}>{e2.label}</Button>)} </td>
                </tr>)
            }

        </tbody>
    </table></div>
}



export const TableListPage = <T extends ItemBase, Q extends PaginationQueryBase>(
    pageProps: ListPageProps<T>,
    header: TableCell<T>[],
    operations?: OperationCallback<T>[],
    initialQuery?: Q,
    MyNavBar?: React.FC<{ pageProps: ListPageProps<T>, initialValue?: Partial<T> }>,
    addMax?: number,
    searchFields?: FieldMeta<T>[],
    ListTopView?: React.FC<{ list?: T[], pageProps?: ListPageProps<T>, initialValue?: Partial<T> }>,
    ListBottomView?: React.FC<{ list?: T[], pageProps?: ListPageProps<T>, initialValue?: Partial<T> }>
) => {

    // let currentQuery: Q = { ...initialQuery } as Q
    //如果指定了存储，则试图从localStorage中加载
    //if (pageProps.initalQueryKey) {
    const initalQueryKey = pageProps.cacheKey + "/initialQuery"
    //  const v = CacheStorage.getItem(initalQueryKey, StorageType.OnlySessionStorage)
    //  if (v) currentQuery = JSON.parse(v) || initialQuery
    //}
    const { current } = useRef({ query: { ...initialQuery } as Q })

    const { isLoading, isError, errMsg, loadMoreState, setQuery, refreshCount, list, setRefresh, setUseCache, setIsLoadMore }
        = useCacheList<T, Q>(pageProps.listApi, pageProps.cacheKey, current.query, pageProps.needLoadMore === false ? false : true)

    if (f7ProConfig.EnableLog) console.log("TableListPage: currentQuery=" + JSON.stringify(current.query))


    //从缓存中刷新
    useBus('refreshList-' + pageProps.id, () => {
        setRefresh()
        if (f7ProConfig.EnableLog) console.log("recv refreshList notify, refresh=" + refreshCount)
    }, [refreshCount])

    useBus('searchReset', () => {
        if (f7ProConfig.EnableLog) console.log("recv searchReset")
        Cache.evictCache(initalQueryKey, StorageType.OnlySessionStorage)

        current.query = { ...initialQuery } as Q
        setUseCache(false)
        setQuery(initialQuery)
    })
    useBus('search', () => {
        if (f7ProConfig.EnableLog) console.log("recv search")

        CacheStorage.saveObject(initalQueryKey, current.query, StorageType.OnlySessionStorage)
        setUseCache(false)
        setQuery(current.query)
    })

    //修改后重新加载数据, 因为需要刷新数据，故没有将List提取出来作为单独的component
    const pageReInit = () => {
        if (f7ProConfig.EnableLog) console.log("pageReInit, refresh=" + refreshCount)
        setRefresh()
        document.title = pageProps.name + "列表"
    }
    useEffect(() => {
        setQuery(current.query)
        document.title = pageProps.name + "列表"
    }, [])

    return <Page name={pageProps.id} id={pageProps.id}
        noNavbar={!pageProps.hasNavBar}
        stacked={false}
        onPageReinit={pageReInit}
    >
    {MyNavBar ? <MyNavBar pageProps={pageProps} />
            : (pageProps.hasNavBar && <Navbar title={pageProps.name} backLink={pageProps.noBackLink ? undefined : f7ProConfig.TextBack} >
                {(pageProps.topRightPopoverMenuItems && pageProps.topRightPopoverMenuItems.length > 0) && <NavRight><Link iconOnly iconF7="gear_alt" popoverOpen="#popover-menu-ops"></Link></NavRight>}
            </Navbar>)}
        {
            (searchFields && searchFields.length > 0) && SearchView(searchFields, current.query, () => {
                const p = current.query?.pagination
                //如果值有改变，则重置lastId
                if (p) {
                    setIsLoadMore(false)
                    //修改搜索条件后，重置分页，从第一页开始
                    //如果指定了current，且大于0，则优先使用current进行分页
                    if (p.current) {
                        p.current = 1
                        p.lastId = undefined
                    } else {
                        p.lastId = undefined
                    }
                }
            })
        }
        {ListTopView && <ListTopView list={list} pageProps={pageProps} />}
        {
            (list && list.length > 0) ?
                <>
                    {TableList(header, list, operations)}

                    {pageProps.needLoadMore !== false && <Block><LoadMore
                        loadMoreState={loadMoreState}
                        isLoading={isLoading}
                        isError={isError}
                        errMsg={errMsg}
                        loadMore={() => {
                            setUseCache(false)
                            setIsLoadMore(true)

                            const p = current.query?.pagination

                            //如果指定了current，且大于0，则优先使用current进行分页
                            if (p?.current) {
                                p.current += 1
                                p.lastId = undefined
                            } else {
                                //排序时，若指定了sortKey则使用指定的，否则默认使用_id
                                const sortKey = (p?.sKey) ? p.sKey : "_id"
                                const lastValue = list[list.length - 1][sortKey] + "" //转换为字符串
                                if (p)
                                    p.lastId = lastValue
                                else {
                                    if (current.query) {
                                        current.query.pagination = { lastId: lastValue }
                                    } else {
                                        const q: PaginationQueryBase = { pagination: { lastId: lastValue } }
                                        current.query = q as Q
                                    }
                                }
                            }
                            setQuery(current.query)
                        }
                        }
                    /></Block>}
                </>
                : <NoDataOrErr isLoading={isLoading} isError={isError} errMsg={errMsg} />
        }
        {ListBottomView && <ListBottomView list={list} pageProps={pageProps} />}
        {
            (pageProps.editPath) &&
            <Toolbar bottom>
                <Button />
                <Button large disabled={addMax !== undefined && list && list.length >= addMax} href={pageProps.editPath ? pageProps.editPath() : undefined} routeProps={{ isAdd: true }}><Icon f7="plus" />{"新增" + pageProps.name}</Button>
                <Button />
            </Toolbar>
        }
 {
            (!MyNavBar && pageProps.topRightPopoverMenuItems && pageProps.topRightPopoverMenuItems.length > 0) ?
                <Popover id="popover-menu-ops">
                    <List>
                        {
                            pageProps.topRightPopoverMenuItems.map((e, i) => <ListItem key={i} link popoverClose onClick={() => e.onClick(list)} title={e.name} />)
                        }
                    </List>
                </Popover> : null
        }
    </Page >
}