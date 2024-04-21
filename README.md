# 1. f7pro

Easy to use [Framework7](https://framework7.io/) in react app.

```
npm i f7pro
```


## 1.1. Features
1. 大大减少列表页和编辑页的重复代码；
2. 简单配置，即可实现增删改查：列表页、加载更多、新增、编辑、删除、保存等功能；
3. 支持列表页的搜索过滤；
4. 下拉列表支持异步加载配置；编辑及搜索中，简单配置即可实现下拉列表项的异步加载；
5. 支持自动缓存功能，列表数据只需从远程加载一次，后面将使用缓存数据；
6.  编辑修改或删除后，返回时列表页数据会立即更新，而不是旧数据；
7. 支持批量操作；
8. 扩展ListInputItem支持图片上传；

## 1.2. CommonListPage

### 1.2.1. 定义

函数定义说明：
```typescript
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
    )
```

定义如下：
```typescript
/** 
 * 避免踩坑提示：
 * 0. 所有列表项的值必须有_id或key作为唯一主键，也就是需继承自ItemBase
 * 1. 列表页面和编辑页面的cacheKey要相同，避免编辑后不能更新缓存，从而页面展示不能实时更新
 * 2. cacheKey很可能是动态值，也就是不同的initalQuery对应不同的列表，否则可能显示时共用一个列表 若为空则不使用缓存数据
 * 3. delApi后面没有”/“，自动会拼接上_id或key
 * 4. 后端对del的实现必须是get请求，且id在路径中
 * 5. 后端实现save保存操作，必须返回列表项值，主要是后端可能对值做了额外调整，返回它，可以使用最新的，否则某些后端更新的字段不能立即显示出来
 */
 export interface PageProps {
    cacheKey?: string //不同的搜索条件initialQuery，应给出不同的缓存键值，如： appId+"/fan/"+scene，否则可能共用列表值 若为空则不使用缓存数据
    id: string,//page的名称和id，如“oaList”
    name: string, //名称，将用于展示给用户 如“公众号”
    hasNavBar?: boolean, //是否有导航栏
    noBackLink?: boolean, //是否有返回按钮
    key?: string //primary key, _id for mongoDB doc, id for sql record
}



export interface ListPageProps<T extends ItemBase> extends PageProps {
    listApi: string, //请求列表api，如'/api/oa/admin/list'
    delApi?: string, // 不提供则无删除按钮，删除Api， 如"/api/ad/admin/del" ，将自动再最后拼接id，最后拼接为："/api/ad/admin/del/{id}"
    editPath?: (e: Partial<T>) => string, //不提供则不进入编辑页面，如"/admin/oa/edit", 当用于新增时，初始不全，故用Partial
    needLoadMore?: boolean //默认为true，是否显示加载更多按钮 
    swipeItemsLeft?: (e: T) => SwipeItem<T>[], //左侧按钮，向右滑动后的按钮项，传入e是因为可以根据值动态改变按钮文字或颜色
    swipeItemsRight?: (e: T) => SwipeItem<T>[], //右侧按钮，向左滑动后的按钮项，传入e是因为可以根据值动态改变按钮文字或颜色
}



export interface SwipeItem<T extends ItemBase> {
    name: string, //名称
    color: string, //颜色
    onClick: (e: T)=>void //点击后的动作
}
```

- 提供了delApi，则会自动增加向右滑动删除按钮，否则无删除按钮
- 提供了editPath，则会列表页底栏，自动增加新增按钮，向右滑动有编辑按钮；新增的初始值由调用CommonListPage(...)时的initialValue传给EditPage，编辑时将列表项值作为参数传给EditPage，EditPage通过item参数接收，同时isAdd在新增时为true。

### 1.2.2. 基本用法
```typescript
//公众号列表
export const OaListPage: React.FC = () => {
    
    const listProps: ListPageProps<PrefOfficialAccount> = {
        cacheKey: "oa/list", //缓存键
        id: "oaList",//将用于缓存，page的名称和id，如“oaList”
        name: "公众号", //名称，将用于展示给用户 如“公众号”
        hasNavBar: true, //是否展示NavBar
        listApi: "/api/wx/admin/oa/pref/basic/list", //后端请求列表api，如'/api/oa/admin/list'
        delApi: "/api/wx/admin/oa/pref/basic/del", // 删除Api， 如"/api/oa/admin/del" ，将自动再最后拼接id，最后拼接为："/api/oa/admin/del/{id}"
    
        editPath: (e)=>`/wx/admin/oa/edit/${e?._id}`, //编辑页面
    }
    const listItemPropsFunc = (e: PrefOfficialAccount) => {
        const props: ListItemProps = {
            title: e.name,
            link: `/wx/admin/oa/home/${e._id}`
        }
        return props
    }
    return CommonListPage(listProps, undefined, listItemPropsFunc)
}
```
另，如果一次性加载全部数据，不需加载更多按钮，可设置：needLoadMore为false


### 1.2.3. 添加滑动按钮
```typescript
swipeItemsRight: [{color: "yellow", name: "同步Agent信息", onClick:(e: AgentConfig)=>{
            fetchWithLoading<number>(
                () => get(`/api/wx/admin/work/agent/sync/${corpId}/${e.agentId}`),
                () => { f7.toast.show({ text: "successfully" })})
        }}]
```
swipeItemsRight表示向右滑动出现的按钮数组，其中color为按钮颜色，name为按钮文字，onClick为点击后的动作

swipeItemsLeft表示向左滑动的按钮数组，若添加了editPath和delApi，会自动添加进“编辑”和“删除”按钮


完整代码如下：
```typescript
export const AgentConfigListPage: React.FC = (props: any) => {
    const corpId  = props.f7route.params.corpId
    const pageProps: ListPageProps<AgentConfig> = {
        cacheKey: corpId+"/agentConfigList",
        id: "agentConfigList",//将用于缓存，page的名称和id，如“oaList”
        name: "企业应用", //名称，将用于展示给用户 如“公众号”
        hasNavBar: true,
        needLoadMore: false,
        listApi: "/api/wx/admin/work/agentConfig?corpId="+corpId, //请求列表api，如 /api/wx/admin/oa/fan
        delApi: "/api/wx/admin/work/agentConfig/del",
        editPath: () => `/wx/admin/work/agentConfig/edit/${corpId}`, //亦可直接从数据库编辑
        swipeItemsRight: [{color: "yellow", name: "同步Agent信息", onClick:(e: AgentConfig)=>{
            fetchWithLoading<number>(
                () => get(`/api/wx/admin/work/agent/sync/${corpId}/${e.agentId}`),
                () => { f7.toast.show({ text: "successfully" })})
        }}]
    }
    const listItemPropsFunc = (e: AgentConfig) => {
        const props: ListItemProps = {
            title: e.name,
            text: e.corpId,
            after: e.agentId,
            footer: e.corpId,
            external: true,
            link: e.url
        }
        return props
    }

    return CommonListPage(pageProps,undefined,  listItemPropsFunc)
}
```


### 1.2.4. 自定义ListView


当提供的配置不能满足要求时，可自定义ListView或其它的CardListView
示例如下：
```typescript
//展示粉丝用户的列表
const FanListView: React.FC<{ list: Fan[] }> = ({ list }) => {
    //console.log("list="+JSON.stringify(list))
    return <List mediaList className="my-media-list">
    {list.map((item, i) => <ListItem key={item._id} link={"/wx/admin/oa/fan/click/history/"+ item.appId + "/" + item._id} routeProps={{ item }}>
            <img slot="media" src={item.img} className="avatar" />
            <div slot="title" ><GuestNameInfo {...item} /> </div>
            <div slot="subtitle">
                <IconClockTime str={formatDateTime(item.t)} />
            </div>
            <div slot="footer" > <IconLocation str={(item.cty ? item.cty + " " : "") + (item.pro ? item.pro + " " : "") + (item.city ? item.city : "")} />&nbsp;{item.ss}&nbsp;{item.qrs}</div>
        </ListItem>)}
</List>
}
    

//scene作为query参数可选，用于channel中某个channel查询带来多少粉丝
export const OaFanListPage: React.FC = (props: any) => {
    const appId = props.f7route.params.appId
    const scene = props.f7route.query.scene

    const pageProps: ListPageProps<Fan> = {
        cacheKey: appId+"/fan/"+(scene||'all'),
        id: "fanList",//将用于缓存，page的名称和id，如“oaList”
        name: "粉丝", //名称，将用于展示给用户 如“公众号”
        hasNavBar: true,
        listApi: "/api/wx/admin/oa/fan/list", //请求列表api，如 /api/wx/admin/oa/fan
    }
    const initialQuery: FanListQuery = { appId, qrs: scene, pagination:{sKey: "st", sKeyType: "TypeNumber"}}

    return CommonListPage(pageProps, undefined, undefined,undefined, initialQuery, undefined, FanListView)
}
```


### 1.2.5. 自定义NavBar

示例代码：
```typescript

//TODO:页面返回时，关闭MyPopover
const MyNavBar: React.FC<{ pageProps: ListPageProps<MenuTree>, initialValue?: Partial<MenuTree> }> = (props) => <>
    <Navbar title={props.pageProps.name} backLink={props.pageProps.noBackLink ? undefined : TextBack} >
        <NavRight><Link iconOnly iconF7="gear_alt" popoverOpen="#popover-menu-ops"></Link></NavRight>
    </Navbar>
    <Popover id="popover-menu-ops">
        <List>
            <ListItem onClick={() => exeCmd("create", props.initialValue?.appId)} popoverClose title="同步到公众号(创建)" />
            <ListItem onClick={() => exeCmd("del", props.initialValue?.appId)} popoverClose title="删除公众号菜单" />
            <ListItem onClick={() => exeCmd("get", props.initialValue?.appId)} popoverClose title="获取公众号菜单（获取）" />
        </List>
    </Popover>
</>


//公众号Menu列表
export const OaMenuListPage: React.FC = (props: any) => {
    const appId = props.f7route.params.appId

    const pageProps: ListPageProps<MenuTree> = {
        cacheKey: appId+"/oamenu",
        id: "menuList",//将用于缓存，page的名称和id，如“oaList”
        name: "公众号菜单", //名称，将用于展示给用户 如“公众号”
        hasNavBar: true,
        listApi: "/api/wx/admin/oa/pref/menu/list", //请求列表api，如'/api/oa/admin/list'
        delApi: "/api/wx/admin/oa/pref/menu/del", // 删除Api， 如"/api/oa/admin/del" ，将自动再最后拼接id，最后拼接为："/api/oa/admin/del/{id}"

        editPath: (e) => `/wx/admin/oa/menu/edit/${appId}`, //编辑页面
    }
    const initialQuery: PaginationQueryForApp = { appId: props.f7route.params.appId }


    return CommonListPage(pageProps, undefined, undefined, { appId, type: "view" }, initialQuery, undefined, MenuListView, MyNavBar)
}

```

示例中ListView也是自定义的

### 1.2.6. 多字段搜索

CommonListPage最后一个字段指定了可供搜索的字段
```typescript

//搜索条件
const fields: FieldMeta<Article>[] = [
    {
        name: "scope",
        label: "公开等级",
        required: false,
        type: "select",
        selectOptions: scopeOptions
    },
    {
        name: "appId",
        label: "所属",
        required: false,
        type: "select",
        selectOptions: appIdOptions
    },
    {
        name: "state",
        label: "状态",
        type: "select",
        selectOptions: stateOptions
    },
    {
        name: "tag",
        label: "标签",
        type: "text",
    },
    {
        name: "keyword",
        label: "关键字",
        type: "text",
    },
]


export const NewsAdminListPage: React.FC<{ item?: Article }> = (props: any) => {
  
    const pageProps: ListPageProps<Article> = {
        cacheKey: adminNewsListcacheKey,
        id: adminNewsListcacheKey,//将用于缓存，page的名称和id，如“oaList”
        name: "素材管理", //名称，将用于展示给用户 如“公众号”
        hasNavBar: true,
        noBackLink: false,
        listApi: "/api/a/admin/list", //请求列表api，如'/api/oa/admin/list'
        delApi: "/api/a/admin/cmd/del", // 删除Api， 如"/api/oa/admin/del" ，将自动再最后拼接id，最后拼接为："/api/oa/admin/del/{id}"
    }
    
    const listProps: ListProps = { mediaList: true, className: "my-media-list" }

    const auth = WxAuthHelper.getAuthBean()
    if (!auth?.uId) {
        return <Page >
            {hasNavBar() ? <Navbar title="出错了" backLink={TextBack} /> : null}
            <Block>
                {props.msg}
            </Block>
        </Page>
    } else {
        return CommonListPage(pageProps, listProps, undefined, undefined, initialQuery,
            undefined, NewsList, undefined, undefined, fields)
    }

}

```




### 1.2.7. 排序选项


```typescript
export const CustomerListPage = (props: any) => {
    const appId = props.f7route.params.appId
    const shopId = props.f7route.query["shopId"]

    const pageProps: ListPageProps<Customer> = {
        cacheKey: "customerList",
        id: "customerList",//将用于缓存，page的名称和id，如“oaList”
        //initalQueryKey: "/initalQuery", //可以都一样，通过cacheKey区分
        name: "客户", //名称，将用于展示给用户 如“公众号”
        hasNavBar: true,
        noBackLink: true,
        listApi: "/api/afterSale/admin/customer/list", //请求列表api，如'/api/oa/admin/list'
    }

    const PageSize = 30

    const auth = WxAuthHelper.getAuthBean()

    const initialQuery: CustomerPaginationQueryForApp = { owner: auth?.uId,  appId, shopId, gId: auth?.gId?.join(','), pagination: { pageSize: PageSize, current: 1, sKey: 'orderT', sKeyType: "TypeNumber", sort: -1  } }

    const initialValue = {appId: appId, shopId: shopId }

    const sortOptions: SortOption[] = [
        {//新订单
            label: "默认排序", pagination: { pageSize: PageSize, current: 1, sKey: 'orderT', sKeyType: "TypeNumber", sort: -1 }, //不能为空，否则值变成了label 请选择 
        },
        {
            label: "有售前信息且最新",
            pagination: { pageSize: PageSize, current: 1, sKey: 'preSaleT', sKeyType: "TypeNumber", sort: -1 }, //不能为空，否则值变成了label 请选择 
        },
        {
            label: "有售后日志且最新",
            pagination: { pageSize: PageSize, current: 1, sKey: 'logT', sKeyType: "TypeNumber", sort: -1 }, //不能为空，否则值变成了label 请选择 
        },
        {
            label: "有售后信息且最新",
            pagination: { pageSize: PageSize, current: 1, sKey: 'infoT', sKeyType: "TypeNumber", sort: -1 }, //不能为空，否则值变成了label 请选择 
        },
    ]
    const searchFields = [
        {
            name: "owner",
            label: "责任人",
            type: "select",
            selectOptions: [
                { value: auth?.uId, label: auth?.nick || "自己" },
                { value: '0', label: "待分派" },
                { value: '-1', label: "全部" }, //  
            ]
        },
        {
            name: "shopId",
            label: "店铺",
            isSearchKey: true,
            type: "asyncSelect",
            asyncSelectProps: {
                key: "/shopList", //缓存键
                url: "/api/afterSale/admin/shop/list", //请求url
                query: { appId, status: 1, gId: auth?.gId?.join(','), umi: encodeUmi( { pageSize: 100 }) }, //请求参数
                convertFunc: (item: Shop) => {
                    const option: SelectOption = {
                        label: item.name,
                        value: item._id
                    }
                    return option
                } //将请求结果转换为select option
            }
        },
        {
            name: "productId",
            label: "商品",
            isSearchKey: true,
            type: "asyncSelect",
            asyncSelectProps: {
                key: "/productList", //缓存键
                url: "/api/afterSale/admin/product/list", //请求url
                query: { appId, status: 1, umi: encodeUmi( { pageSize: 100 })  }, //请求参数
                convertFunc: (item: Product) => {
                    const option: SelectOption = {
                        label: item.name,
                        value: item._id
                    }
                    return option
                } //将请求结果转换为select option
            }
        },
        {
            name: "status",
            label: "状态",
            type: "select",
            selectOptions: [
                { value: '-1', label: "请选择" }, //不能为空，否则值变成了label 请选择
                { value: '0', label: "待加好友" },
                { value: '1', label: "未加上" },
                { value: '2', label: "服务中" },
                { value: '3', label: "已结束" },
                { value: '4', label: "已关闭" },
            ]
        },
        {
            name: "name",
            label: "姓名",
            type: "text"
        },
        {
            name: "sort",
            label: "排序",
            type: "sort",
            sortOptions: sortOptions //排序字段暂时没有值，排序会出问题，等完善后再打开
        }
    ]

    return CommonListPage(pageProps, //listProps, listItemPropsFunc,
        undefined, undefined, initialValue, initialQuery, undefined, ListCardView, MyNavBar, undefined, searchFields)
}


```
### 1.2.8. 下拉列表框异步加载
见上例中，指定的asyncSelectProps属性，包含了缓存键，查询url，查询query参数，结果转换函数：
```typescript
{
            name: "productId",
            label: "商品",
            isSearchKey: true,
            type: "asyncSelect",
            asyncSelectProps: {
                key: "/productList", //缓存键
                url: "/api/afterSale/admin/product/list", //请求url
                query: { appId, status: 1, umi: encodeUmi( { pageSize: 100 })  }, //请求参数
                convertFunc: (item: Product) => {
                    const option: SelectOption = {
                        label: item.name,
                        value: item._id
                    }
                    return option
                } //将请求结果转换为select option
            }
        },
```
此用法也适合于编辑页面的输入有下拉列表框


- 直接使用AsyncSelectInput

在自己的List中作为ListInputItem，异步加载：


```typescript
   
                {AsynSelectInput( { label:"所属", name:"appId", defaultValue: article.appId},
                   (newValue) => {
                    appIdRef.current = newValue+""
                }, "key",{
                    key: "/appIdList", //缓存键
                    url: Api.Site.List, //请求url
                    convertFunc: (item: Site) => {
                        const option: SelectOption = {
                            label: item.name,
                            value: item._id
                        }
                        return option
                    } //将请求结果转换为select option
                } )}
```

### 1.2.9. TopCustomView

自定义顶部view
```typescript
...

    const TopPreviewButtons: React.FC<{ list?: Ad[]}> = ({list}) => {
        const popup = useRef<PhotoBrowser>(null);
        return (
        <Block>
            <Button raised  onClick={() => {
                       popup.current.open()
                    }}>预览广告图</Button>
            <PhotoBrowser photos={list?.map((e)=>e.src.trim())} type="popup" ref={popup} />
        </Block>
        )      
    }


    return CommonListPage(pageProps, undefined, listItemPropsFunc,undefined,undefined,undefined,undefined,undefined,TopPreviewButtons)
```
## 1.3. 批量操作

### 1.3.1. TableListPage
与CommonListPage类似，额外添加了两个参数，去除了列表项等参数
```typescript
header: TableCell<T>[],
operations?: OperationCallback<T>[],
```

TableListPage声明如下：
```typescript
export const TableListPage = <T extends ItemBase, Q extends PaginationQueryBase>(
    pageProps: ListPageProps<T>,
    header: TableCell<T>[],
    operations?: OperationCallback<T>[],
    initialValue?: Partial<T>,
    initialQuery?: Q,
    MyNavBar?: React.FC<{ pageProps: ListPageProps<T>, initialValue?: Partial<T> }>,
    addMax?: number,
    searchFields?: FieldMeta<T>[]) => {}
```
大部分参数和CommonListPage的相同，用法也雷同。


TableCell和OperationCallback定义如下：
```typescript
export interface TableCell<T extends ItemBase> {
    label: string, //表头名称
    className: "label-cell" | "numeric-cell" | "medium-only",
    cellValue: (e: T) => string | number | undefined//用于从TableData中的T中取值
}

export interface OperationCallback<T extends ItemBase> {
    label: string
    needConfirm?: boolean
    confirmTip?: string //对话框提示
    callback: (selected: T) => void //批量操作执行动作
}
```


一个表头的示例：
```typescript

    const header: TableCell<Customer>[] = [
        { label: "姓名", className: "label-cell", cellValue: (e) => e.name },
        { label: "售后老师", className: "label-cell", cellValue: (e) => e.ownerName || '待分派' },
        { label: "商品", className: "label-cell", cellValue: (e) => e.orders[0].product || '' },
        { label: "店铺", className: "label-cell", cellValue: (e) => e.orders[0].shop || '' },
        { label: "状态", className: "label-cell", cellValue: (e) => StatusArray[e.status] },
    ]

```


### 1.3.2. ListBatchTableCard

现有列表全部数据

将传递过来的数据进行批量操作，先选择后操作
```typescript
/**
 * 只是对当前的data列表数据进行选择，然后批量操作，不自行加载数据
 * @param header 表头
 * @param batchs 批量操作
 * @param defaultIdentiyKey 标识ID，如_id, id(或其它数据库唯一键)
 * @param data 列表数据
 * @returns 
 */
export const ListBatchTableCard = <T extends ItemBase>(
    header: TableCell<T>[], 
    batchs: BatchCallback<T>[], 
    defaultIdentiyKey?: string, 
    data?: T[]) => {}
```


示例如下：
```typescript
    const batchs: BatchCallback<Customer>[] = [
        { label: "批量分派给他人", callback: batchAssignOtherCb },
        { label: "批量分派给自己",  needConfirm: true, confirmTip: "确定批量分派给自己吗？", callback: batchAssignSelf },
        { label: "批量改状态",  needConfirm: true, confirmTip: "确定批量修改状态吗？", callback: batchUpdateStatus }
    ]

    return (
        <Page name="customerBatchs" stacked> <Navbar title="批量操作" backLink={TextBack} />
            {ListBatchTableCard(header, batchs, props.pageProps[key || "_id"], list)}

  
        </Page>
    )

```

定义如下：
```typescript
//向后端提交远程操作的参数
export interface BatchOperationParams{
    ids: string //以 ","分隔的_id
    action: string //操作命令如： del, assign, updateStatus
    arg1?: string //提交的参数
    arg2?: string //提交的参数
}

export interface BatchCallback<T extends ItemBase> {
    label: string
    needConfirm?: boolean
    confirmTip?: string //对话框提示
    callback: (selected: T[]) => void //批量操作执行动作
}
```



## 1.4. CommonItemEditPage

### 1.4.1. 定义
```typescript
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
    listProps?: ListProps,
    isAdd?: string,
    onSaveSuccess?: (() => void)
) 
```

其中EditPageProps定义如下：
```typescript
export interface EditPageProps<T extends ItemBase> extends PageProps {
    saveApi: string, //请求列表api，如'/api/oa/admin/save'
    saveText?: string //保存按钮文字可以定制
    saveCallback?: (item: Partial<T>)=> void //可以代替向远程提交代码，校验都会进行，无论是否提供saveCallback
}
```

FieldMeta扩展了F7中的ListInputProps，定义输入字段元属性
```typescript
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
```


### 1.4.2. 基本用法

```typescript

export const OaEditPage: React.FC<{ item: PrefOfficialAccount }> = (props: any) => {

    const editProps: EditPageProps<PrefOfficialAccount> = {
        cacheKey: "oa/list",
        id: "oaEdit",//将用于缓存，page的名称和id，如“oaList”
        name: "公众号配置", //名称，将用于展示给用户 如“公众号”
        hasNavBar: true,
        saveApi: "/api/wx/admin/oa/pref/basic/save", 
    }
    const fieldProps: FieldMeta<PrefOfficialAccount>[] = [
        {
            name: "name",
            label: "名称",
            required: true,
            placeholder:"公众号名称",
            type: "text",
        },
        {
            name: "_id",
            label: "AppId",
            required: true,
            placeholder:"公众号AppId",
            type: "text",
        },
        {
            name: "secret",
            label: "秘钥",
            required: true,
            placeholder:"秘钥",
            type: "text",
        },
        {
            name: "token",
            label: "Token",
            required: true,
            type: "text",
        },
        {
            name: "aesKey",
            label: "AESKey",
            required: true,
            placeholder:"AES",
            type: "text",
        },
        {
            name: "host",
            label: "主机域名",
            required: true,
            placeholder:"模板消息需要，例：http://wx.xxx.com",
            type: "text",
        },
        {
            name: "wechatId",
            label: "微信号",
            required: false,
            placeholder:"选填",
            type: "text",
        },
        {
            name: "enable",
            label: "是否激活",
            required: false,
            placeholder:"选填",
            type: "radio",
        }
    
    ]
    
    const oa = props.item || {enable: true} //新增时默认值

    return CommonItemEditPage(editProps, fieldProps, oa)
}
```


```typescript
export const AdEditPage: React.FC<{ item: Ad , isAdd: boolean}> = (props: any) => {
    //const corpId = props.f7route.params.corpId

    const editProps: EditPageProps<Ad> = {
        cacheKey: "adList", //需与列表页中的cacheKey相同
        id: "adEdit",//page的名称和id
        name: "推广", //名称，将用于展示给用户
        hasNavBar: true,
        saveApi: "/api/ad/admin/save"
    }
    const fieldProps: FieldMeta<Ad>[] = [
        {
            name: "name",
            label: "名称",
            required: true,
            validate: true,
            pattern:".+",
            type: "text",
            placeholder:"将会显示在文章底部产品推荐中"
        },
        {
            name: "src",
            label: "推广图",
            required: true,
            type: "textarea",
            errorMessage: "请填写agentID",
            placeholder:"图片链接,最好长条形，网页顶部幻灯片",
            maxlength: 512
        },
        {
            name: "to",
            label: "落地页",
            required: true,
            placeholder:"落地页链接，如产品链接",
            type: "textarea",
        },
        {
            name: "tags",
            label: "标签",
            required: true,
            placeholder:"用于匹配文章，空格分开",
            handleChangedValue: (fieldValue) => (fieldValue === '') ? undefined : fieldValue.split(' ').filter((e: string) => e.trim() !== ''),
            handleIntialValue: (fieldValue) => fieldValue?.join(' '),
            type: "textarea",
        },
        {
            name: "state",
            label: "状态",
            required: true,
            type: "select",
            selectOptions: [ { value: "0", label: "关闭" },
            { value: "1", label: "打开" },]
        },
        {
            name: "fb",
            required: false,
            label: "fallback(默认)",
            type: "switch",
        },
    ]
    
    const item = props.item || {fb: false, state: 1} //新增时预置字段值

    return CommonItemEditPage(editProps, fieldProps, item, props.isAdd)
}

```

### 1.4.3. 输入项依赖

当某输入项依赖另一输入项，动态显示或隐藏

使用depend函数，示例如下
```typescript

//TODO: 保存新建子菜单后需要单独处理,构建菜单树
export const OaMenuEditPage: React.FC<{ item: OaMenuItem }> = (props: any) => {
    const appId = props.f7route.params.appId
    const editProps: EditPageProps<OaMenuItem> = {
        cacheKey: appId+"/oamenu",
        id: "oaMenu",//将用于缓存，page的名称和id，如“oaList”
        name: "公众号菜单", //名称，将用于展示给用户 如“公众号”
        hasNavBar: true,
        saveApi: "/api/wx/admin/oa/pref/menu/save",
    }

    const selectOptions: SelectOption[] = [
        { value: "parent", label: "一级菜单" },
        { value: "click", label: "点击推事件" },
        { value: "view", label: "跳转URL" },
        { value: "scancode_push", label: "扫码推事件" },
        { value: "scancode_waitmsg", label: "扫码推事件(弹出“消息接收中”)" },
        { value: "pic_sysphoto", label: "弹出系统拍照发图" },
        { value: "pic_photo_or_album", label: "弹出拍照或者相册发图" },
        { value: "pic_weixin", label: "弹出企业微信相册发图器" },
        { value: "location_select", label: "弹出地理位置选择器" },
        { value: "miniprogram", label: "跳转到小程序" },
        { value: "media_id", label: "下发素材给用户" },
        { value: "view_limited", label: "跳转图文消息URL" },
    ]
    const fieldProps: FieldMeta<OaMenuItem>[] = [
        {
            name: "name",
            label: "名称",
            required: true,
            placeholder: "菜单名称",
            type: "text",
        },
        {
            name: "type",
            label: "类型",
            required: true,
            type: "select",
            selectOptions: selectOptions
        },
        {
            name: "key",
            label: "菜单KEY值", //click等点击类型必须	菜单KEY值，用于消息接口推送，不超过128字节
            placeholder: "click等点击类型必须,用于消息接口推送",
            type: "textarea",
            maxlength: 64,
            required: true,
            errorMessage: TypeEnumHint["click"],
            depend: (e?: Partial<OaMenuItem>) => e?.type === 'click'
        },
        {
            name: "url",
            label: "跳转路径",//view类型必须	网页链接，成员点击菜单可打开链接，不超过1024字节。为了提高安全性，建议使用https的url
            placeholder: "view类型必须，点击菜单可打开链接,只是跳转路径，如/#!/n/list?appId=wx704f95ccd0255b91",
            type: "textarea",
            maxlength: 1024,
            required: true,
            errorMessage: TypeEnumHint["view"],
            depend: (e?: Partial<OaMenuItem>) => e?.type === 'view'
        },
        {
            name: "mediaId",
            label: "素材ID", //下发素材给用户
            placeholder: "下发素材给用户",
            type: "textarea",
            maxlength: 1024,
            required: true,
            errorMessage: TypeEnumHint["media_id"],
            depend: (e?: Partial<OaMenuItem>) => e?.type === 'media_id'
        },
        {
            name: "pagePath",
            label: "小程序页面路径",//view_miniprogram类型必须	小程序的页面路径
            placeholder: "跳转到小程序",
            type: "textarea",
            maxlength: 1024,
            required: true,
            errorMessage: TypeEnumHint["miniprogram"],
            depend: (e?: Partial<OaMenuItem>) => e?.type === 'miniprogram'
        },
        {
            name: "miniId",
            label: "小程序的appid", //小程序的appid（仅认证公众号可配置）
            placeholder: "仅认证公众号可配置",
            type: "text",
            required: true,
            errorMessage: TypeEnumHint["miniprogram"],
            depend: (e?: Partial<OaMenuItem>) => e?.type === 'miniprogram'
        },


    ]

    const item = props.item || { appId: props.item?.appId } //新增时则默认激活

    return CommonItemEditPage(editProps, fieldProps, item)
}



```


### 1.4.4. TopCustomView

自定义顶部view
```typescript
...

   const TopPreviewButtons: React.FC<{ originalItem?: Partial<SkuBean>}> = ({originalItem}) => {
        const popup = useRef<PhotoBrowser>(null);
        return (
        <Block>
            <Button raised  onClick={() => {
                       popup.current.open()
                    }}>预览主图</Button>
            <PhotoBrowser photos={originalItem?.mains?.split(',').map((e)=>e.trim())} type="popup" ref={popup} />
        </Block>
        )      
    }

...

  return CommonItemEditPage(editProps, fieldProps, props.item, props.isAdd, undefined, undefined, TopPreviewButtons)
```


### 1.4.5. sub-object

```typescript

export interface Msg extends MongoItem{
  appId: string
  name: string
  msg: Text|Media|Music|Video|News
}

export interface MsgContent{
  //___type: string //from backend
  _class: string //from backend ApiJson.serverSerializeJson.classDiscriminator
}
export interface Text extends MsgContent{
  content: String
}

export interface Media  extends MsgContent{
  mediaId: String
}


//...



  const fieldProps: FieldMeta[] = [
        {
            name: "name",
            label: "名称",
            required: true,
            placeholder:"消息名称",
            type: "text",
            clearButton: true
        },
        {
            name: "msg",
            label: "消息",
            required: true,
            type: "object",
            objectProps:[
                {
                    name: "_class",
                    label: "类型",
                    required: true,
                    type: "select",
                    selectOptions:[//TODO:暂只支持回复消息，群发消息和客服消息暂不支持
                        {value: "", label: '请选择'},
                        {value: "text", label: '文本消息（被动回复|群发|客服）'},
                        {value:"voice", label: '语音消息（被动回复|群发|客服）'},
                        {value:"image", label: '单图片消息（被动回复|客服）'},
                        //{value:"images", label: '多图片消息（群发）'},
                        {value:"video", label: '视频消息（被动回复|群发）'},
                        //{value:"video_kf", label: '视频消息（客服）'},
                        {value:"music", label: '音乐消息（被动回复|客服）'},
                        {value:"news", label: '外链图文消息（被动回复|客服, 点击跳转到外链）'},
                        //{value:"mpnews", label: '图文消息（群发|客服, 点击跳到图文页）'},
                        //{value:"wxcard", label: '卡券消息（群发|客服）'},
                        //{value:"msgmenu", label: '菜单消息（客服）'},
                        //{value:"miniprogrampage", label: '小程序消息（客服）'}
                    ]
                },
                {
                    name: "content",
                    label: "文本内容",
                    required: true,
                    type: "textarea",
                    clearButton: true,
                    depend:(e?: Partial<MsgContent>)=> e?._class === 'text'
                },
                {
                    name: "mediaId",
                    label: "素材MediaId",
                    required: true,
                    type: "text",
                    clearButton: true,
                    depend:(e?: Partial<MsgContent>)=> e?._class === 'video' || e?._class === 'video_kf'  || e?._class === 'voice'  ||e?._class === 'image' 
                },
                {
                    name: "thumbMediaId",
                    label: "音乐封面MediaId",
                    required: true,
                    type: "textarea",
                    clearButton: true,
                    depend:(e?: Partial<MsgContent>)=> e?._class === 'music'
                },
                {
                    name: "musicUrl",
                    label: "音乐链接",
                    required: true,
                    type: "textarea",
                    clearButton: true,
                    depend:(e?: Partial<MsgContent>)=> e?._class === 'music'
                },
                {
                    name: "hqMusicUrl",
                    label: "音乐（高保真）链接",
                    required: false,
                    type: "textarea",
                    clearButton: true,
                    depend:(e?: Partial<MsgContent>)=> e?._class === 'music'
                },
                {
                    name: "title",
                    label: "标题",
                    required: false, //TODO: 对于news 和 mpNews则为true
                    type: "textarea",
                    clearButton: true,
                    depend:(e?: Partial<MsgContent>)=> e?._class === 'music' || e?._class === 'video' || e?._class === 'video_kf' || e?._class === 'news' || e?._class === 'mpnews'
                },
                {
                    name: "description",
                    label: "描述",
                    type: "textarea",
                    required: false, //TODO: 对于news 和 mpNews则为true
                    clearButton: true,
                    depend:(e?: Partial<MsgContent>)=> e?._class === 'music' || e?._class === 'video' || e?._class === 'video_kf' || e?._class === 'news' || e?._class === 'mpnews'
                },
            ]
        },
    ]
```

### 1.4.6. 粘贴操作

有时从别处复制了结构化的数据，可以粘贴时，先解析，解析完成后放到多个字段中

示例代码：

```typescript
export const getFields = (appId: string) => {
    const fieldProps: FieldMeta<OrderInfo>[] = [
        {
            name: "name",
            label: "收货人",
            required: true,
            validate: true,
            clearButton: true,
            pattern: `.+`,
            errorMessage: "不可为空",
            type: "text",
            cfgPasteHandler: cfgPasteHandler
        },
        {
            name: "tel",
            label: "电话",
            required: true,
            validate: true,
            clearButton: true,
            pattern: "^400[0-9]{7}|^(\\+?86)?1\\d{10}$|^0[0-9]{2,3}-?[0-9]{8}",
            errorMessage: "请输入正确的手机、座机等电话",
            type: "text",
            maxlength: 15,
            cfgPasteHandler: cfgPasteHandler
        },
        {
            name: "address",
            label: "地址",
            required: true,
            validate: true,
            clearButton: true,
            pattern: `.+`,
            errorMessage: "不可为空",
            type: "textarea",
            cfgPasteHandler: cfgPasteHandler
        },
     

        {
            name: "time",
            label: "下单日期",
            required: true,
            validate: true,
            //validateOnBlur:true,
            pattern: `^[0-9\\-\\\]+$`,
            errorMessage: "不可为空",
            type: "date",
            //calendarParams:{dateFormat: 'yyyy-mm-dd', closeOnSelect: true, disabled:{from: new Date()}}
        },


        {
            name: "productId",
            label: "商品",
            isSearchKey: true,
            required: true,
            errorMessage: "请选商品",
            //validateOnBlur:true,
            type: "asyncSelect",
            asyncSelectProps: {
                key: "/productList", //缓存键
                url: "/api/afterSale/admin/product/list", //请求url
                query: { appId, status: 1 , umi: encodeUmi( { pageSize: 100 }) }, //请求参数
                convertFunc: (item: Product) => {
                    const option: SelectOption = {
                        label: item.name,
                        value: item._id
                    }
                    return option
                } //将请求结果转换为select option
            }
        },
     

        {
            name: "type",
            label: "订单类型",
            isSearchKey: true,
            required: false,
            type: "select",
            selectOptions: [
                { value: '-1', label: "请选择" }, //不能为空，否则值变成了label 请选择
                { value: '0', label: "静默单" },
                { value: '1', label: "客服单" },
                { value: '2', label: "售后单" },
            ]
        },
   
    ]
    return fieldProps
}



export const OrderInfoEditPage: React.FC<{ item: OrderInfo, isAdd?: string }> = (props: any) => {
    const appId = props.f7route.params.appId
    const editProps: EditPageProps<OrderInfo> = {
        cacheKey: "orderInfoList",
        id: "orderInfoEdit",//page的名称和id
        name: "订单", //名称，将用于展示给用户
        hasNavBar: true,
        saveApi: "/api/afterSale/admin/orderInfo/save",
    }



    const item = props.item || { appId } //新增时预置字段值

    //console.log("OrderInfoEditPage, isAdd="+props.isAdd)
    //isAdd由CommonList新增和编辑按钮中传递过来，需要使用时，则添加进它否则忽略即可
    return CommonItemEditPage(editProps, getFields(appId), item, undefined, props.isAdd)
}
```

其中cfgPasteHandler为粘贴处理函数，用于复制过来的数据的处理，处理完后的数据是列表项数据的Partial。

已知bug：若解析不成功，可能导致无法再手工重新输入

## 1.5. 图片上传
TODO

## 1.6. 避坑指南

### 1.6.1. cacheKey的设置

1.在列表页和编辑页必须相同， 即EditPageProps与ListPageProps中的cacheKey必须相同，否则修改或删除后不能更新到缓存中，也不能从页面上看到实时更新；

2. 不同的app或user，必须通过其id键进行隔离，否则会都使用相同的列表缓存，如下面的示例代码通过appId进行隔离；
3. 为空的话列表页将不使用缓存数据，如某些需要重新加载实时更新的页面


```typescript
export const OaMenuListPage: React.FC = (props: any) => {
    const appId = props.f7route.params.appId

    const pageProps: ListPageProps<MenuTree> = {
        cacheKey: appId+"/oamenu", //与EditPageProps中的相同
      //...

export const OaMenuEditPage: React.FC<{ item: OaMenuItem }> = (props: any) => {
    const appId = props.f7route.params.appId
    const editProps: EditPageProps<OaMenuItem> = {
        cacheKey: appId+"/oamenu", //与ListPageProps中的必须相同，否则修改删除后不能实时更新到列表中
        //...
```


### 1.6.2. key的使用
mongodb默认是_id,
sql类型需要指定为id，若是其它唯一键，需另外指定，包括usecahce中进行配置

目的在于更新缓存，缓存中通过该id找到对应的更新项，然后更新到list中

### 1.6.3. skey排序键

必须存在于列表项类型中，否则找不到该项的值时，无法通过lastId进行搜索下一页

### 1.6.4. save的返回值

必须返回列表项数据，用于添加到列表缓存中，否则可能无法正确更新列表项的值，至于为何要从远端返回，因为远端可能重新生成了一些数据，列表中需要最新的

### 1.6.5. delete的返回值
不做要求，最好不要返回空，返回字符串值将用于toast提示

### 1.6.6. 点击列表项传值

直接通过给listItemPropsFunc指定link参数，将支持点击跳转：
```typescript
    const listItemPropsFunc = (e: SkuOutlineBean) => {
        const props: ListItemProps = {
            title: e.name,
            subtitle: formatYearDateTime(e.createdAt) ,
            text: e.id,
            footer: e.storeName,
            link: '/xcshop/admin/addComment'
        }
        return props
    }
```
跳转后的页面通过item接收传递过来的值：
```typescript
export const AddComment: React.FC<{ item: SkuOutlineBean }> = ({item}) => {
    console.log("sku="+JSON.stringify(item))
}
```
**注意：只能通过item接收值**


若是通过swipeout按钮，可以这样传值：
```typescript
const pageProps: ListPageProps<SkuOutlineBean> = {
        cacheKey: "skuList",
        id: "skuList",//将用于缓存，page的名称和id，如“oaList”
        key: "id", //sql database
        name: "SKU", //名称，将用于展示给用户 如“公众号”
        hasNavBar: true,
        listApi: "/api/xcshop/admin/goods/skuList", 
        swipeItemsRight:[{name:"去评价", color:"yellow", onClick:(e)=>{
            f7.views.main.router.navigate({name: "addComment"},{props:{item: e}})
        }}],
    }
```

留意上面的`f7.views.main.router.navigate({name: "addComment"},{props:{item: e}})`
不是:`{props: e}`，否则目的接收控件应该为：
```typescript
export const AddComment: React.FC<SkuOutlineBean> = (props) => {
    console.log("sku="+JSON.stringify(props))
}
```

### 1.6.7. 下拉列表空项
由于避免使用非受控组件，可指定
```typescript
const NullOption: SelectOption[] = [{value:"-2", label:"请选择"}]
```
在fieldProps中，需添加NullOption，表示未选中任何一项
```typescript
{
            name: "nickTag",
            label: "昵称类别",
            required: false,
            type: "select",
            selectOptions: NullOption.concat(NickTags.map((e)=>{
                const option: SelectOption = {"value": e, "label": e}
                return option
            } ))
        },
```
后端需额外处理这个空值，当做空项