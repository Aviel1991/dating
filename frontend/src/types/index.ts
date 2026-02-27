export type Gender = 'male' | 'female' | 'other';
export type RelationshipStatus = 'single' | 'divorced' | 'widowed' | 'other';
export type EventStatus = 'draft' | 'published' | 'closed' | 'completed' | 'cancelled';
export type RegistrationStatus = 'pending' | 'approved' | 'rejected' | 'waitlisted' | 'cancelled';
export type EligibilityStatus = 'eligible' | 'needs_photo' | 'disabled';
export type AttendanceStatus = 'not_arrived' | 'arrived';
export type MatchType = 'romantic' | 'friend' | 'both';
export type MatchStatus = 'pending_admin_approval' | 'approved' | 'rejected';

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  birthDate: string;
  gender: Gender;
  relationshipStatus: RelationshipStatus;
  facebookUrl: string;
  instagramUrl?: string;
  aboutText: string;
  lookingForText: string;
  profilePhotoUrl?: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  coverImageUrl: string;
  coverImageWidth: number;
  coverImageHeight: number;
  startsAt: string;
  endsAt: string;
  locationName: string;
  locationAddress?: string;
  capacityTotal: number;
  capacityMale?: number;
  capacityFemale?: number;
  registrationOpenAt: string;
  registrationCloseAt: string;
  selectionOpenAt?: string;
  selectionCloseAt?: string;
  status: EventStatus;
  createdByAdminId: string;
  createdAt: string;
  updatedAt: string;
  stats?: {
    pending: number;
    approved: number;
    needsPhoto: number;
    arrived: number;
  };
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  approvedRequiresPhoto: boolean;
  adminNote?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedByAdminId?: string;
  user?: Partial<User>;
  event?: Partial<Event>;
  eligibilityStatus?: EligibilityStatus;
}

export interface EventParticipant {
  id: string;
  eventId: string;
  userId: string;
  displayName: string;
  displayPhotoUrl?: string;
  gender: Gender;
  eligibilityStatus: EligibilityStatus;
  createdAt: string;
  user?: Partial<User>;
  attendance?: Attendance;
}

export interface Attendance {
  id: string;
  eventId: string;
  userId: string;
  status: AttendanceStatus;
  checkinTime?: string;
  checkedInByAdminId?: string;
  method: 'manual';
  createdAt: string;
  updatedAt: string;
}

export interface Choice {
  id: string;
  eventId: string;
  fromUserId: string;
  toUserId: string;
  interestedRomantic?: boolean | null;
  interestedFriend?: boolean | null;
  notInterested?: boolean | null;
  submittedAt?: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  eventId: string;
  userAId: string;
  userBId: string;
  matchType: MatchType;
  status: MatchStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedByAdminId?: string;
  reviewNote?: string;
  notifiedAt?: string;
  userA?: Partial<User>;
  userB?: Partial<User>;
}

export interface SelectionParticipant {
  userId: string;
  displayName: string;
  photoUrl?: string;
  gender: Gender;
  choice?: Choice | null;
}

export interface MyMatch {
  matchId: string;
  matchType: MatchType;
  createdAt: string;
  otherUser: {
    id: string;
    fullName: string;
    photoUrl?: string;
    phone: string;
    instagramUrl?: string;
  };
}
