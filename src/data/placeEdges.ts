import { PlaceEdge } from '../types';

export const placeEdges: PlaceEdge[] = [
  { fromPlaceId:'P001', toPlaceId:'P003', minutes:7, walkingMeters:500, bidirectional:true, verificationStatus:'sample' },
  { fromPlaceId:'P003', toPlaceId:'P004', minutes:3, walkingMeters:220, bidirectional:true, verificationStatus:'sample' },
  { fromPlaceId:'P004', toPlaceId:'P007', minutes:6, walkingMeters:450, bidirectional:true, verificationStatus:'sample' },
  { fromPlaceId:'P007', toPlaceId:'P006', minutes:6, walkingMeters:430, bidirectional:true, verificationStatus:'sample' },
  { fromPlaceId:'P006', toPlaceId:'P008', minutes:10, walkingMeters:750, bidirectional:true, verificationStatus:'sample' },
  { fromPlaceId:'P001', toPlaceId:'P005', minutes:8, walkingMeters:600, bidirectional:true, verificationStatus:'sample' },
  { fromPlaceId:'P005', toPlaceId:'P006', minutes:5, walkingMeters:360, bidirectional:true, verificationStatus:'sample' },
  { fromPlaceId:'P005', toPlaceId:'P007', minutes:6, walkingMeters:450, bidirectional:true, verificationStatus:'sample' },
  { fromPlaceId:'P001', toPlaceId:'P002', minutes:18, walkingMeters:1300, bidirectional:true, verificationStatus:'sample' },
  { fromPlaceId:'P003', toPlaceId:'P002', minutes:15, walkingMeters:1100, bidirectional:true, verificationStatus:'sample' },
  { fromPlaceId:'P004', toPlaceId:'P002', minutes:16, walkingMeters:1180, bidirectional:true, verificationStatus:'sample' },
  { fromPlaceId:'P001', toPlaceId:'P009', minutes:9, walkingMeters:650, bidirectional:true, verificationStatus:'sample' },
  { fromPlaceId:'P003', toPlaceId:'P009', minutes:5, walkingMeters:360, bidirectional:true, verificationStatus:'sample' },
  { fromPlaceId:'P001', toPlaceId:'P010', minutes:4, walkingMeters:300, bidirectional:true, verificationStatus:'sample' },
];
