import React, { useState } from 'react';
import {
    Link,
    Card,
    CardContent,
    CardHeader,
    Checkbox,
    f7,
} from 'framework7-react';
import { ItemBase } from './datatype/ItemBase';
import { TableCell } from './datatype/TableCell';
import { BatchCallback } from './datatype/BatchCallback';
import { UseCacheConfig } from "@rwsbillyang/usecache";




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
    data?: T[]) => {
    const [selected,setSelected] = useState<T[]>([])

    return <Card className="data-table data-table-init">
        <CardHeader>
            <div className="data-table-header">
                <div className="data-table-title">请选择</div>
            </div>

            <div className="data-table-header-selected">
                <div className="data-table-title-selected">
                    <span className="data-table-selected-count"></span>条被选中
                </div>
                <div className="data-table-actions">
                    {batchs.map((e) => <Link onClick={() => {
                        if(e.needConfirm === true) 
                            f7.dialog.confirm(e.confirmTip || '确定要批量操作吗？', ()=>e.callback(selected))
                        else e.callback(selected)
                    }}>{e.label}</Link>)}
                </div>
            </div>

        </CardHeader>

        <CardContent padding={false}>
            <table>
                <thead>
                    <tr>
                        <th className="checkbox-cell"> <Checkbox value="all" onChange={(e) => {
                                 //const value = e.target.value;
                                 if (e.target.checked) {
                                     if(data){
                                        setSelected(data)
                                     }else  setSelected([]);
                                 } else {
                                    setSelected([]);
                                 }
                            }} /></th>
                        {header.map((c) => <th className={c.className}>{c.label}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {
                        data?.map((e) => <tr>
                            <td className="checkbox-cell"> <Checkbox value={e[defaultIdentiyKey || UseCacheConfig.defaultIdentiyKey]} onChange={(e) => {
                                 const value = e.target.value;
                                 if (e.target.checked) {
                                    const index = data.findIndex(e=>e[defaultIdentiyKey || UseCacheConfig.defaultIdentiyKey] === value)
                                    if(index >= 0) selected.push(data[index])
                                    else console.log("not found id="+value)
                                 } else {
                                    const index = selected.findIndex(e=>e[defaultIdentiyKey || UseCacheConfig.defaultIdentiyKey] === value)
                                    selected.splice(index, 1);
                                 }
                            }}/> </td>
                            {header.map((c) => <td className={c.className}>{c.cellValue(e)}</td>)}
                        </tr>)
                    }
                </tbody>
            </table>
        </CardContent>
    </Card>
}
