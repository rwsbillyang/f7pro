import React from "react"

import { Link, Preloader } from "framework7-react"


export const LoadMore: React.FC<{loadMoreState: boolean, loadMore: () => void, isLoading?: boolean, isError?:boolean, errMsg?: string}>
    = ({ isLoading, loadMoreState, loadMore, isError, errMsg }) =>
        <div style={{ textAlign: 'center', paddingBottom: "25px" }}>
            {isLoading ? <Preloader /> : (loadMoreState ?
                <Link onClick={loadMore}>加载更多</Link> : <span style={{ color: 'gray', fontSize: "12px"}}>{isError? errMsg: "没有更多数据"}</span>)}
        </div>
