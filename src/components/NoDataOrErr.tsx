import React from "react"

import { Block, Preloader } from "framework7-react"



//没有数据或其它错误信息，通常用于列表页首次请求而没有数据的情况
export const NoDataOrErr: React.FC<{isLoading?: boolean, isError?:boolean, errMsg?: string, text?: string}>
    = ({ isLoading,  isError, errMsg, text }) =>
     <Block className="text-align-center">{isLoading? <Preloader size={42} /> : <span style={{ color: 'gray', fontSize: "12px"}} >{isError? errMsg: text||"暂无数据"}</span>}</Block>
