

//向后端提交远程操作的参数
export interface BatchOperationParams{
    ids: string //以 ","分隔的_id
    action: string //操作命令如： del, assign, updateStatus
    arg1?: string //提交的参数
    arg2?: string //提交的参数
}