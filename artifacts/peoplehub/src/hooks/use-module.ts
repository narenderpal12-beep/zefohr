import {useGetMe,getGetMeQueryKey} from '@workspace/api-client-react';
export function useModule(key:string) {
  const {data,isLoading}=useGetMe({query:{queryKey:getGetMeQueryKey(),retry:false}});
  const module=data?.modules.find(m=>m.key===key);
  const status=data?.subscription?.status;
  return {enabled:!!module?.enabled && (status==='trial'||status==='active'),module,isLoading};
}
