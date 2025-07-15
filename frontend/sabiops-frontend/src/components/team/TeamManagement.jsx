import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar } from '../ui/avatar';
import { Users, Plus, Settings, Shield, UserCheck, Mail, Phone, MoreVertical } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const TeamManagement = ({ teamData, loading }) => {
  const { user, isOwner } = useAuth();
  const [showAddMember, setShowAddMember] = useState(false);

  if (!isOwner) {
    return null; // Only owners can see team management
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 via-white to-blue-50 border-purple-200 shadow-lg">
        <CardHeader>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const mockTeamData = teamData || [
    { 
      id: 1, 
      name: 'John Admin', 
      role: 'Admin', 
      status: 'active', 
      email: 'jo***@example.com',
      phone: '+234***1234',
      joinDate: '2024-01-15',
      lastActive: '2 hours ago'
    },
    { 
      id: 2, 
      name: 'Sarah Sales', 
      role: 'Salesperson', 
      status: 'active', 
      email: 'sa***@example.com',
      phone: '+234***5678',
      joinDate: '2024-02-01',
      lastActive: '1 day ago'
    }
  ];

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Owner': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      case 'Admin': return 'bg-gradient-to-r from-blue-500 to-purple-600 text-white';
      case 'Salesperson': return 'bg-gradient-to-r from-green-500 to-teal-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Owner': return Shield;
      case 'Admin': return Settings;
      case 'Salesperson': return UserCheck;
      default: return Users;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 via-white to-blue-50 border-purple-200 shadow-lg overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 shadow-sm" />
      <CardHeader className="pb-4 bg-gradient-to-r from-purple-100 to-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-purple-900">Team Management</CardTitle>
              <p className="text-sm text-purple-700 font-medium">
                {mockTeamData.length + 1} team members • Owner access
              </p>
            </div>
          </div>
          <Button 
            size="sm" 
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => setShowAddMember(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Member
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 bg-gradient-to-br from-white to-purple-50">
        <div className="space-y-4">
          {/* Owner (Current User) */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold text-lg">
                  {user?.full_name?.charAt(0) || 'O'}
                </Avatar>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900">{user?.full_name || 'Owner'}</h3>
                  <Badge className={getRoleBadgeColor('Owner')}>
                    <Shield className="h-3 w-3 mr-1" />
                    Owner
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Mail className="h-3 w-3" />
                    <span>{user?.email}</span>
                  </div>
                  <span className="text-xs text-green-600 font-medium">● Online</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">You</p>
              <p className="text-xs text-gray-500">Full Access</p>
            </div>
          </div>

          {/* Team Members */}
          {mockTeamData.map((member) => {
            const RoleIcon = getRoleIcon(member.role);
            return (
              <div key={member.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-purple-300 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 text-white font-bold text-lg">
                      {member.name.charAt(0)}
                    </Avatar>
                    <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      member.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{member.name}</h3>
                      <Badge className={getRoleBadgeColor(member.role)}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {member.role}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Mail className="h-3 w-3" />
                        <span>{member.email}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Phone className="h-3 w-3" />
                        <span>{member.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Last active</p>
                    <p className="text-xs text-gray-600 font-medium">{member.lastActive}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Add Member Form */}
          {showAddMember && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-3">Add Team Member</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option value="">Select Role</option>
                    <option value="Admin">Admin</option>
                    <option value="Salesperson">Salesperson</option>
                  </select>
                  <input 
                    type="tel" 
                    placeholder="Phone Number" 
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                    Send Invitation
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowAddMember(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Team Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{mockTeamData.length + 1}</p>
              <p className="text-xs text-blue-700 font-medium">Total Members</p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{mockTeamData.filter(m => m.status === 'active').length + 1}</p>
              <p className="text-xs text-green-700 font-medium">Active</p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">2</p>
              <p className="text-xs text-purple-700 font-medium">Roles</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { TeamManagement };
export default TeamManagement;