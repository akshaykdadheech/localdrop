// Client → Server
export interface PingMsg { type: 'ping' }
export interface JoinRoomCodeMsg { type: 'join-room-code'; code: string }
export interface LeaveRoomMsg { type: 'leave-room' }
export interface OfferMsg { type: 'offer'; to: string; sdp: string }
export interface AnswerMsg { type: 'answer'; to: string; sdp: string }
export interface IceCandidateMsg { type: 'ice-candidate'; to: string; candidate: RTCIceCandidateInit }

export interface SetNameMsg { type: 'set-name'; name: string }
export interface SetLocalSubnetMsg { type: 'set-local-subnet'; subnet: string }

export type ClientMessage =
  | PingMsg
  | JoinRoomCodeMsg
  | LeaveRoomMsg
  | OfferMsg
  | AnswerMsg
  | IceCandidateMsg
  | SetNameMsg
  | SetLocalSubnetMsg;

// Server → Client
export interface PongMsg { type: 'pong' }

export interface PeerInfo {
  id: string;
  displayName: string;
  avatarSeed: string;
  isSelf?: boolean;
}

export interface ServerHelloMsg { type: 'server-hello'; peerId: string; displayName: string; avatarSeed: string }
export interface PeerListMsg { type: 'peer-list'; peers: PeerInfo[] }
export interface PeerJoinedMsg { type: 'peer-joined'; peer: PeerInfo }
export interface PeerLeftMsg { type: 'peer-left'; peerId: string }


export interface RelayedOfferMsg { type: 'offer'; from: string; sdp: string }
export interface RelayedAnswerMsg { type: 'answer'; from: string; sdp: string }
export interface RelayedIceMsg { type: 'ice-candidate'; from: string; candidate: RTCIceCandidateInit }

export interface RoomJoinedMsg { type: 'room-joined'; code: string; peers: PeerInfo[] }
export interface RoomErrorMsg { type: 'room-error'; message: string }

export type ServerMessage =
  | PongMsg
  | ServerHelloMsg
  | PeerListMsg
  | PeerJoinedMsg
  | PeerLeftMsg
  | RelayedOfferMsg
  | RelayedAnswerMsg
  | RelayedIceMsg
  | RoomJoinedMsg
  | RoomErrorMsg;
