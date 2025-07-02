export interface TeamMember {
  id: string;
  name: string;
  email: string;
  password?: string; // لن نعرض كلمة المرور في الواجهة
  avatar?: string;
  roleId: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
  phone?: string;
  department?: string;
  bio?: string;
}

export interface CreateTeamMemberInput {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  roleId: string;
  isActive?: boolean;
  isVerified?: boolean;
}

export interface UpdateTeamMemberInput {
  name?: string;
  email?: string;
  password?: string;
  avatar?: string;
  roleId?: string;
  isActive?: boolean;
  isVerified?: boolean;
  phone?: string;
  department?: string;
  bio?: string;
} 