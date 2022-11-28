import { ItemBase } from "./ItemBase"
import { PageProps } from "./PageProps"

export interface ListPageProps<T extends ItemBase> extends PageProps {
    listApi: string, //请求列表api，如'/api/oa/admin/list'
    delApi?: string, // 不提供则无删除按钮，删除Api， 如"/api/ad/admin/del" ，将自动再最后拼接id，最后拼接为："/api/ad/admin/del/{id}"
    editPath?: (e: Partial<T>) => string, //不提供则不进入编辑页面，如"/admin/oa/edit"
    needLoadMore?: boolean //默认为true 
    swipeItemsLeft?: SwipeItem[], //向左滑动后的按钮项
    swipeItemsRight?: SwipeItem[], //向右滑动后的按钮项
    //clickPath?: (e?: Partial<T>) => string | undefined //点击后进入的页面,若为空，则不可点击。 如"/admin/oa/:appId/home/"，调用者负责拼接id
}


export interface SwipeItem{
    name: string,
    color: string,
    onClick: ()=>void
}