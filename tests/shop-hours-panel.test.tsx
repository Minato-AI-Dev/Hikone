// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import ShopHoursPanel from '../src/ShopHoursPanel';
import {shoppingPlaces} from '../src/data/shoppingPlaces';
beforeEach(()=>{vi.stubEnv('VITE_SHOP_HOURS_ENDPOINT','https://backend.example/api/shop-hours');vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({results:[{shopId:'SHOP001',status:'scheduled_open',checkedAt:'2026-11-02T03:00:00Z',reason:'Google掲載情報では取得時点で営業中'}]})})));});
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.unstubAllEnvs()});
it('only asks Places when the user requests a check and never invents an open status for other shops',async()=>{
 render(<ShopHoursPanel/>);expect(fetch).not.toHaveBeenCalled();
 fireEvent.click(screen.getByText(/四番町スクエアのお店の営業時間を確認する/));
 expect(screen.getAllByText('営業状況は未確認')).toHaveLength(3);
 fireEvent.click(screen.getByRole('button',{name:'最新の掲載営業状況を確認する'}));
 await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(1));
 const body=JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
 expect(body).toEqual({shopIds:shoppingPlaces.map(shop=>shop.id)});
 expect(await screen.findByText('取得時点では営業中')).toBeTruthy();
 expect(screen.getAllByText('営業状況は未確認')).toHaveLength(2);
 expect(document.body.textContent).toMatch(/到着時の営業/);
});
it('does not convert request failure to business closure',async()=>{
 vi.mocked(fetch).mockRejectedValueOnce(new Error('offline'));
 render(<ShopHoursPanel/>);fireEvent.click(screen.getByText(/四番町スクエアのお店の営業時間を確認する/));
 fireEvent.click(screen.getByRole('button',{name:'最新の掲載営業状況を確認する'}));
 expect(await screen.findByText(/営業状況を取得できませんでした/)).toBeTruthy();
 expect(screen.getAllByText('営業状況は未確認')).toHaveLength(3);
});
