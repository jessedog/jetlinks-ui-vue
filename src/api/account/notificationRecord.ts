import server from '@/utils/request'

// 获取记录列表
export const getList_api = (data:object): any =>server.get(`/notifications/_query`,encodeParams(data))
// 修改记录状态
export const changeStatus_api = (type:'_read'|'_unread',data:string[]): any =>server.post(`/notifications/${type}`,data)


const encodeParams = (params: Record<string, any>) => {
    let result = {}
    for (const key in params) {
        if (Object.prototype.hasOwnProperty.call(params, key)) {
            const value = params[key];
            if(key === 'terms') {
                result['terms[0].column:'] = 0
                result['terms[0].value'] = JSON.stringify(value[0])
            }else result[key] = value
        }
    }

    return result
};