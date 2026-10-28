// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import App from '../src/App';
import {autoRecommend} from '../src/lib/walkingRoutes';
vi.mock('../src/lib/walkingRoutes',()=>({autoRecommend:vi.fn(async()=>({recommendations:[],source:'unavailable',warning:'internal routing diagnostics'}))}));
beforeEach(()=>{localStorage.clear();vi.clearAllMocks();vi.stubGlobal('fetch',vi.fn(async()=>({ok:true})));});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('lets visitors set and then clear a walking cap in the single questionnaire',async()=>{
 render(<App/>);fireEvent.click(screen.getByRole('button',{name:'協力せずにはじめる'}));
 for(let i=0;i<5;i++)fireEvent.click(screen.getByRole('button',{name:'次へ',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'15分まで',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'おすすめを見る',exact:true}));
 await screen.findByText(/徒歩は合計15分まで/);
 fireEvent.click(screen.getByRole('button',{name:'条件を変える',exact:true}));
 for(let i=0;i<5;i++)fireEvent.click(screen.getByRole('button',{name:'次へ',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'上限なし',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'おすすめを見る',exact:true}));
 await waitFor(()=>expect(vi.mocked(autoRecommend).mock.calls.at(-1)?.[0].maxWalkMin).toBeNull());
 expect(screen.queryByText('internal routing diagnostics')).toBeNull();
 expect(fetch).not.toHaveBeenCalled();
});
it('asks about research before any tourist controls or events, including legacy consent',()=>{
 localStorage.setItem('hikone-field-consent-v1','yes');
 render(<App/>);
 expect(screen.getByRole('heading',{name:/協力しますか/})).toBeTruthy();
 expect(screen.queryByRole('button',{name:'現在地を取得する'})).toBeNull();
 expect(screen.queryByRole('button',{name:'寄り道を探す'})).toBeNull();
 expect(fetch).not.toHaveBeenCalled();
 expect(localStorage.getItem('hikone-field-consent-v1')).toBeNull();
});
it('gives a visitor who declines the same questionnaire without sending analytics',()=>{
 render(<App/>);fireEvent.click(screen.getByRole('button',{name:'協力せずにはじめる'}));
 expect(screen.getByRole('heading',{name:'今どこにいますか？'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'次へ',exact:true}));
 expect(fetch).not.toHaveBeenCalled();
 expect(document.body.textContent).not.toMatch(/CSV|DEMO|DEBUG|自由入力で相談|行き先一覧|開発用情報/);
});
it('sends only event names after agreement and stops after withdrawal',()=>{
 render(<App/>);fireEvent.click(screen.getByRole('button',{name:'協力してはじめる'}));
 expect(screen.getByRole('heading',{name:'今どこにいますか？'})).toBeTruthy();
 expect(fetch).toHaveBeenCalled();
 for(const [,init] of vi.mocked(fetch).mock.calls)expect(Object.keys(JSON.parse(init!.body as string))).toEqual(['event']);
 fireEvent.click(screen.getByText('調査への協力',{selector:'summary'}));
 fireEvent.click(screen.getByRole('button',{name:'協力をやめる'}));
 const count=vi.mocked(fetch).mock.calls.length;
 fireEvent.click(screen.getByRole('button',{name:'次の彦根'}));
 fireEvent.click(screen.getByRole('button',{name:/寄り道を探す/}));
 expect(vi.mocked(fetch).mock.calls).toHaveLength(count);
 expect(localStorage.getItem('hikone-field-consent-v1')).toBeNull();
});
it('remembers a declined choice without asking again or collecting events',()=>{
 const view=render(<App/>);fireEvent.click(screen.getByRole('button',{name:'協力せずにはじめる'}));view.unmount();
 render(<App/>);expect(screen.queryByRole('heading',{name:/協力しますか/})).toBeNull();
 expect(screen.getByRole('button',{name:/寄り道を探す/})).toBeTruthy();expect(fetch).not.toHaveBeenCalled();
});

it('does not count an empty recommendation result as a recommendation view',async()=>{
 render(<App/>);fireEvent.click(screen.getByRole('button',{name:'協力してはじめる'}));
 for(let i=0;i<5;i++)fireEvent.click(screen.getByRole('button',{name:'次へ',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'おすすめを見る',exact:true}));
 await screen.findByText('今の条件では、寄り道なしが安心です');
 const events=vi.mocked(fetch).mock.calls.map(([,init])=>JSON.parse(init!.body as string).event);
 expect(events).not.toContain('recommendation_viewed');
});
it('leaves loading and allows retry after an unexpected recommendation failure',async()=>{
 vi.mocked(autoRecommend).mockRejectedValueOnce(new Error('unexpected'));
 render(<App/>);fireEvent.click(screen.getByRole('button',{name:'協力せずにはじめる'}));
 for(let i=0;i<5;i++)fireEvent.click(screen.getByRole('button',{name:'次へ',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'おすすめを見る',exact:true}));
 await screen.findByText(/おすすめを取得できませんでした/);
 expect(screen.queryByText('徒歩経路を確認中…')).toBeNull();
 expect(screen.getByRole('button',{name:'条件を変える'})).toBeTruthy();
});
