// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../src/App';
import { autoRecommend } from '../src/lib/walkingRoutes';
vi.mock('../src/lib/walkingRoutes',()=>({autoRecommend:vi.fn(async()=>({recommendations:[],source:'unavailable',warning:'取得できません'}))}));
vi.mock('../src/lib/hikoneAI',()=>({understandWithHikoneAI:vi.fn(async()=>({answers:{maxWalkMin:15},source:'fallback'})),presentWithHikoneAI:vi.fn(),applyAIPresentation:vi.fn()}));
afterEach(cleanup);
it('allows clearing an AI-derived walking cap in the questionnaire',async()=>{
 render(<App/>);fireEvent.click(screen.getByRole('button',{name:/自由入力で相談する/}));
 fireEvent.change(screen.getByRole('textbox'),{target:{value:'徒歩15分まで'}});fireEvent.click(screen.getAllByRole('button',{name:'寄り道を探す',exact:true})[0]);
 await screen.findByText(/徒歩は合計15分まで/);fireEvent.click(screen.getByRole('button',{name:'条件を変える',exact:true}));
 for(let i=0;i<6;i++)fireEvent.click(screen.getByRole('button',{name:'次へ',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'上限なし',exact:true}));fireEvent.click(screen.getByRole('button',{name:'おすすめを見る',exact:true}));
 await waitFor(()=>expect(vi.mocked(autoRecommend).mock.calls.at(-1)?.[0].maxWalkMin).toBeNull());
});

