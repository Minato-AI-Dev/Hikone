// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import HikoneAI from '../src/HikoneAI';
vi.mock('../src/lib/walkingRoutes',()=>({autoRecommend:vi.fn(async()=>({recommendations:[],source:'unavailable',warning:'経路を取得できません'}))}));
vi.mock('../src/lib/hikoneAI',()=>({understandWithHikoneAI:vi.fn(async()=>({answers:{},source:'fallback'})),presentWithHikoneAI:vi.fn(),applyAIPresentation:vi.fn()}));
afterEach(cleanup);
const answers={currentNodeId:'S01',finalNodeId:'D01',remainingTimeMin:35,interestTagIds:[],availableMode:'徒歩' as const,maxWalkMin:null,detourPreference:'少しなら' as const,discoveryOptIn:true,firstVisit:true};
it('passes routing warnings from free input to the results screen',async()=>{
  const done=vi.fn();render(<HikoneAI answers={answers} history={null} onResolved={done} onBack={()=>{}}/>);
  fireEvent.change(screen.getByRole('textbox'),{target:{value:'写真が撮りたい'}});fireEvent.click(screen.getByRole('button',{name:'寄り道を探す'}));
  await waitFor(()=>expect(done).toHaveBeenCalled());expect(done.mock.calls[0][4]).toEqual(expect.objectContaining({warning:'経路を取得できません',source:'unavailable'}));
});
it('ignores pending results after leaving the component',async()=>{
  const {autoRecommend}=await import('../src/lib/walkingRoutes');let finish:(value:any)=>void=()=>{};
  vi.mocked(autoRecommend).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve}));
  const done=vi.fn();const view=render(<HikoneAI answers={answers} history={null} onResolved={done} onBack={()=>{}}/>);
  fireEvent.change(screen.getByRole('textbox'),{target:{value:'写真'}});fireEvent.click(screen.getByRole('button',{name:'寄り道を探す'}));
  await waitFor(()=>expect(autoRecommend).toHaveBeenCalled());view.unmount();finish({recommendations:[],source:'unavailable',warning:'failed'});
  await new Promise(resolve=>setTimeout(resolve,10));expect(done).not.toHaveBeenCalled();
});
