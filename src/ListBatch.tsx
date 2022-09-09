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
import { UseCacheConfig } from 'usecache';
import { PageProps } from './datatype/PageProps';



//批量操作，先选择后批量操作
export const ListBatchTableCard = <T extends ItemBase>(header: TableCell<T>[], batchs: BatchCallback<T>[], pageProps: PageProps, data?: T[]) => {
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
                            <td className="checkbox-cell"> <Checkbox value={e[pageProps.key || UseCacheConfig.defaultIdentiyKey]} onChange={(e) => {
                                 const value = e.target.value;
                                 if (e.target.checked) {
                                    const index = data.findIndex(e=>e[pageProps.key || UseCacheConfig.defaultIdentiyKey] === value)
                                    if(index >= 0) selected.push(data[index])
                                    else console.log("not found id="+value)
                                 } else {
                                    const index = selected.findIndex(e=>e[pageProps.key || UseCacheConfig.defaultIdentiyKey] === value)
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