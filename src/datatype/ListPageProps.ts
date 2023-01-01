import { ItemBase } from "./ItemBase"
import { PageProps } from "./PageProps"

export interface ListPageProps<T extends ItemBase> extends PageProps {
    listApi: string, //请求列表api，如'/api/oa/admin/list'
    delApi?: string, // 不提供则无删除按钮，删除Api， 如"/api/ad/admin/del" ，将自动再最后拼接id，最后拼接为："/api/ad/admin/del/{id}"
    editPath?: (e?: Partial<T>) => string, //不提供则不进入编辑页面，如"/admin/oa/edit", 当用于新增时，初始不全，故用Partial
    needLoadMore?: boolean //默认为true，是否显示加载更多按钮 
    swipeItemsLeft?: (e: T) => SwipeItem<T>[], //左侧按钮，向右滑动后的按钮项，传入e是因为可以根据值动态改变按钮文字或颜色
    swipeItemsRight?: (e: T) => SwipeItem<T>[], //右侧按钮，向左滑动后的按钮项，传入e是因为可以根据值动态改变按钮文字或颜色
}


export interface SwipeItem<T extends ItemBase> {
    name: string, //名称
    color: string, //颜色
    onClick: (e: T)=>void //点击后的动作
}