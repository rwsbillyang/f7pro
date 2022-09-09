
/**
 * 列表项值 基类，必须有_id字段
 */
 export interface ItemBase extends Object {
    
 }

 
/**
 * with _id as primary key
 */
export interface MongoItem extends ItemBase{
    _id: string
}

/**
 * with id as primary key
 */
export interface SqlItem extends ItemBase{
    id: string
}