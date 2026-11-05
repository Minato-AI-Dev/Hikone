// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import App from '../src/App';
vi.mock('../src/lib/walkingRoutes',()=>({autoRecommend:vi.fn(async()=>({recommendations:[],source:'unavailable',warning:'経路を取得できません'}))}));
beforeEach(()=>{localStorage.clear();vi.clearAllMocks();vi.stubGlobal('fetch',vi.fn(async()=>({ok:true})));});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('keeps research consent optional before showing secondary journeys',()=>{
 render(<App/>);
 expect(screen.getByRole('heading',{name:/協力しますか/})).toBeTruthy();
 expect(screen.queryByRole('button',{name:/AIに相談する/})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'協力せずにはじめる'}));
 fireEvent.click(screen.getByRole('button',{name:'次の彦根'}));
 expect(screen.getByRole('button',{name:/AIに相談する/})).toBeTruthy();
 expect(screen.getByRole('button',{name:/場所から探す/})).toBeTruthy();
 expect(fetch).not.toHaveBeenCalled();
});
it('navigates AI, catalog and history without sending analytics',()=>{
 render(<App/>);
 fireEvent.click(screen.getByRole('button',{name:'協力せずにはじめる'}));
 fireEvent.click(screen.getByRole('button',{name:'次の彦根'}));
 fireEvent.click(screen.getByRole('button',{name:/AIに相談する/}));
 expect(screen.getByRole('heading',{name:'今の気分を教えてください。'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'戻る'}));
 fireEvent.click(screen.getByRole('button',{name:/場所から探す/}));
 expect(screen.getByRole('heading',{name:'次は、どんな彦根を見る？'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'ホームへ戻る'}));
 fireEvent.click(screen.getByRole('button',{name:/旅の記録を見る/}));
 expect(screen.getByRole('heading',{name:'あなたの彦根の記録'})).toBeTruthy();
 expect(screen.getByText(/まだ記録はありません/)).toBeTruthy();
 expect(fetch).not.toHaveBeenCalled();
});
