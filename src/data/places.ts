import { Place } from '../types';

export const places: Place[] = [
  { id:'P001', name:'彦根城', category:['landmark','history'], regionalPriority:1, navigationUrl:'https://www.google.com/maps/search/?api=1&query=%E5%BD%A6%E6%A0%B9%E5%9F%8E', verificationStatus:'sample', active:true },
  { id:'P002', name:'彦根駅', category:['transport'], regionalPriority:0, navigationUrl:'https://www.google.com/maps/search/?api=1&query=%E5%BD%A6%E6%A0%B9%E9%A7%85', verificationStatus:'sample', active:true },
  { id:'P003', name:'夢京橋キャッスルロード', category:['shopping','townscape'], regionalPriority:2, navigationUrl:'https://www.google.com/maps/search/?api=1&query=%E5%A4%A2%E4%BA%AC%E6%A9%8B%E3%82%AD%E3%83%A3%E3%83%83%E3%82%B9%E3%83%AB%E3%83%AD%E3%83%BC%E3%83%89', verificationStatus:'sample', active:true },
  { id:'P004', name:'四番町スクエア', category:['food','shopping','townscape'], regionalPriority:2, navigationUrl:'https://www.google.com/maps/search/?api=1&query=%E5%9B%9B%E7%95%AA%E7%94%BA%E3%82%B9%E3%82%AF%E3%82%A8%E3%82%A2', verificationStatus:'sample', active:true },
  { id:'P005', name:'足軽屋敷周辺', category:['history','town_walking','local_life'], regionalPriority:4, navigationUrl:'https://www.google.com/maps/search/?api=1&query=%E5%BD%A6%E6%A0%B9+%E8%B6%B3%E8%BB%BD%E5%B1%8B%E6%95%B7', verificationStatus:'sample', active:true },
  { id:'P006', name:'芹橋周辺', category:['town_walking','local_life'], regionalPriority:5, navigationUrl:'https://www.google.com/maps/search/?api=1&query=%E5%BD%A6%E6%A0%B9+%E8%8A%B9%E6%A9%8B', verificationStatus:'sample', active:true },
  { id:'P007', name:'花しょうぶ通り', category:['characters','retro','town_walking'], regionalPriority:5, navigationUrl:'https://www.google.com/maps/search/?api=1&query=%E5%BD%A6%E6%A0%B9+%E8%8A%B1%E3%81%97%E3%82%87%E3%81%86%E3%81%B6%E9%80%9A%E3%82%8A', verificationStatus:'sample', active:true },
  { id:'P008', name:'七曲がり', category:['craft','townscape','local_life'], regionalPriority:5, navigationUrl:'https://www.google.com/maps/search/?api=1&query=%E5%BD%A6%E6%A0%B9+%E4%B8%83%E6%9B%B2%E3%81%8C%E3%82%8A', verificationStatus:'sample', active:true },
  { id:'P009', name:'京橋口駐車場', category:['parking'], regionalPriority:0, navigationUrl:'https://www.google.com/maps/search/?api=1&query=%E5%BD%A6%E6%A0%B9+%E4%BA%AC%E6%A9%8B%E5%8F%A3%E9%A7%90%E8%BB%8A%E5%A0%B4', verificationStatus:'sample', active:true },
  { id:'P010', name:'二の丸駐車場', category:['parking'], regionalPriority:0, navigationUrl:'https://www.google.com/maps/search/?api=1&query=%E5%BD%A6%E6%A0%B9+%E4%BA%8C%E3%81%AE%E4%B8%B8%E9%A7%90%E8%BB%8A%E5%A0%B4', verificationStatus:'sample', active:true },
];

export const placeByName=(name:string)=>places.find(p=>p.name===name);
export const placeById=(id:string)=>places.find(p=>p.id===id);
