
/** 
 * 避免踩坑提示：
 * 0. 所有列表项的值必须有_id作为唯一主键，也就是需继承自ItemBase
 * 1. 列表页面和编辑页面的cacheKey要相同，避免编辑后不能更新缓存，从而页面展示不能实时更新
 * 2. cacheKey很可能是动态值，也就是不同的initalQuery对应不同的列表，需要缓存进各自的健里面，否则可能显示时共用一个列表
 * 3. delApi后面没有”/“，自动会拼接上_id
 * 4. 后端对del的实现必须是get请求，且id在路径中
 * 5. 后端实现save保存操作，必须返回列表项值，主要是后端可能对值做了额外调整，返回它，可以使用最新的，否则某些后端更新的字段不能立即显示出来
 */
 export interface PageProps {
    cacheKey: string //不同的搜索条件initialQuery，应给出不同的缓存键值，如： appId+"/fan/"+scene，否则可能共用列表值
    id: string,//将用于缓存，page的名称和id，如“oaList”
    name: string, //名称，将用于展示给用户 如“公众号”
    hasNavBar?: boolean,
    noBackLink?: boolean,
    key?: string //primary key, _id for mongoDB doc, id for sql record
}

