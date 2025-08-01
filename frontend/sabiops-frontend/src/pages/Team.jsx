import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Plus, Search, Edit, Trash2, Users, Eye, EyeOff, UserCheck, UserX, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { getTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember, activateTeamMember, resetTeamMemberPassword } from "../services/api";
import {
  handleApiErrorWithToast,
  showSuccessToast,
  showErrorToast,
  safeArray
} from '../utils/errorHandling';
import RequiredFieldIndicator from '../components/ui/RequiredFieldIndicator';

// Stable form component outside main component to prevent re-renders and input focus loss
const TeamMemberForm = ({ 
  formData, 
  editingMember, 
  showPassword, 
  error, 
  loading, 
  onInputChange, 
  onSubmit, 
  onCancel, 
  onTogglePassword 
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    {error && (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )}

    <div className="space-y-2">
      <Label htmlFor="full_name" className="flex items-center gap-1">
        Full Name
        <RequiredFieldIndicator />
      </Label>
      <Input
        id="full_name"
        name="full_name"
        value={formData.full_name}
        onChange={onInputChange}
        placeholder="Enter full name"
        required
      />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-1">
          Email
          <RequiredFieldIndicator />
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={onInputChange}
          placeholder="Enter email address"
          required
          disabled={editingMember} // Email cannot be changed
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role" className="flex items-center gap-1">
          Role
          <RequiredFieldIndicator />
        </Label>
        <Select 
          value={formData.role} 
          onValueChange={(value) => onInputChange({ target: { name: 'role', value } })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Salesperson">Salesperson</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-1">
          Phone Number
          <RequiredFieldIndicator />
        </Label>
        <Input
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={onInputChange}
          placeholder="Enter phone number"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="flex items-center gap-1">
          {editingMember ? 'New Password (leave blank to keep current)' : 'Password'}
          {!editingMember && <RequiredFieldIndicator />}
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={onInputChange}
            placeholder={editingMember ? "Enter new password" : "Enter password"}
            required={!editingMember}
            minLength={6}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={onTogglePassword}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>

    <div className="flex justify-end space-x-2">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
      >
        Cancel
      </Button>
      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : editingMember ? 'Update Team Member' : 'Add Team Member'}
      </Button>
    </div>
  </form>
);

const Team = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'Salesperson',
    password: ''
  });

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await getTeamMembers();
      
      // Handle different response formats
      if (response && Array.isArray(response)) {
        setTeamMembers(response);
      } else if (response?.team_members) {
        setTeamMembers(Array.isArray(response.team_members) ? response.team_members : []);
      } else if (response?.data?.team_members) {
        setTeamMembers(Array.isArray(response.data.team_members) ? response.data.team_members : []);
      } else {
        console.warn('[TEAM] Unexpected response structure:', response);
        setTeamMembers([]);
      }
    } catch (error) {
      handleApiErrorWithToast(error, 'Failed to load team members');
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePhone = (phone) => {
    // Basic phone validation - at least 10 digits
    const re = /^[0-9]{10,}$/;
    return re.test(phone.replace(/[^0-9]/g, ''));
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      showErrorToast('Full name is required');
      return false;
    }
    
    if (!formData.email.trim()) {
      showErrorToast('Email is required');
      return false;
    }
    
    if (!validateEmail(formData.email)) {
      showErrorToast('Please enter a valid email address');
      return false;
    }
    
    if (!formData.phone.trim()) {
      showErrorToast('Phone number is required');
      return false;
    }
    
    if (!validatePhone(formData.phone)) {
      showErrorToast('Please enter a valid phone number (at least 10 digits)');
      return false;
    }
    
    if (!editingMember && !formData.password.trim()) {
      showErrorToast('Password is required for new team members');
      return false;
    }
    
    if (!editingMember && formData.password.length < 6) {
      showErrorToast('Password must be at least 6 characters long');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const baseData = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        role: formData.role,
      };

      // Conditionally add password to align with backend expectations
      const memberData = { ...baseData };
      if (editingMember) {
        // For updates, only send password if it's being changed
        if (formData.password) {
          memberData.password = formData.password;
        }
      } else {
        // For new members, password is required
        memberData.password = formData.password;
      }

      if (editingMember) {
        await updateTeamMember(editingMember.id, memberData);
        showSuccessToast('Team member updated successfully');
        setShowEditDialog(false);
        setEditingMember(null);
      } else {
        await createTeamMember(memberData);
        showSuccessToast('Team member created successfully');
        setShowAddDialog(false);
      }
      
      resetForm();
      await fetchTeamMembers();
    } catch (error) {
      handleApiErrorWithToast(error, 'Failed to save team member');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      role: 'Salesperson',
      password: ''
    });
    setEditingMember(null);
    setError('');
    setShowPassword(false);
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setFormData({
      full_name: member.full_name || '',
      email: member.email || '',
      phone: member.phone || '',
      role: member.role || 'Salesperson',
      password: ''
    });
    setShowEditDialog(true);
  };

  const handleDelete = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      try {
        setLoading(true);
        const response = await deleteTeamMember(memberId);
        console.log('[TEAM] Delete response:', response);
        showSuccessToast('Team member removed successfully');
        await fetchTeamMembers();
      } catch (error) {
        console.error('Failed to delete team member:', error);
        handleApiErrorWithToast(error, 'Failed to remove team member');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleActivate = async (memberId) => {
    if (window.confirm('Are you sure you want to activate this team member?')) {
      try {
        setLoading(true);
        const response = await activateTeamMember(memberId);
        console.log('[TEAM] Activate response:', response);
        showSuccessToast('Team member activated successfully');
        await fetchTeamMembers();
      } catch (error) {
        console.error('Failed to activate team member:', error);
        handleApiErrorWithToast(error, 'Failed to activate team member');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResetPassword = async (memberId) => {
    if (window.confirm('Are you sure you want to reset this team member\'s password?')) {
      try {
        setLoading(true);
        const response = await resetTeamMemberPassword(memberId);
        console.log('[TEAM] Reset password response:', response);
        
        if (response && response.data && response.data.temporary_password) {
          setTempPassword(response.data.temporary_password);
        } else if (response && response.temporary_password) {
          setTempPassword(response.temporary_password);
        }
        
        showSuccessToast('Password reset successfully');
      } catch (error) {
        console.error('Failed to reset password:', error);
        handleApiErrorWithToast(error, 'Failed to reset password');
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredMembers = teamMembers.filter(member =>
    (member.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stable handler functions for the form
  const handleFormCancel = () => {
    setShowAddDialog(false);
    setShowEditDialog(false);
    resetForm();
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  if (loading && teamMembers.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-3 sm:p-4 flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading team members...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Team Management</h1>
            <p className="text-gray-600 text-sm sm:text-base">Manage your sales team and their permissions</p>
          </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Team Member</DialogTitle>
              <DialogDescription>
                Create a new salesperson account for your team
              </DialogDescription>
            </DialogHeader>
            <TeamMemberForm 
              formData={formData}
              editingMember={editingMember}
              showPassword={showPassword}
              error={error}
              loading={loading}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              onCancel={handleFormCancel}
              onTogglePassword={handleTogglePassword}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team members by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12"
            />
          </div>
        </CardContent>
      </Card>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {filteredMembers.length} team member{filteredMembers.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No team members found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? 'Try adjusting your search criteria'
                  : 'Start building your sales team by adding your first team member'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Team Member
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden sm:table-cell">Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden lg:table-cell">Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="font-medium">{member.full_name}</div>
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell className="hidden sm:table-cell">{member.phone}</TableCell>
                      <TableCell>
                        <Badge variant={member.role === 'Admin' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant={member.active ? 'default' : 'destructive'}>
                          {member.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(member)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!member.active && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleActivate(member.id)}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetPassword(member.id)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(member.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update team member information
            </DialogDescription>
          </DialogHeader>
          <TeamMemberForm 
            formData={formData}
            editingMember={editingMember}
            showPassword={showPassword}
            error={error}
            loading={loading}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onCancel={handleFormCancel}
            onTogglePassword={handleTogglePassword}
          />
        </DialogContent>
      </Dialog>

      {/* Temporary Password Display */}
      {tempPassword && (
        <Dialog open={!!tempPassword} onOpenChange={() => setTempPassword('')}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Password</DialogTitle>
              <DialogDescription>
                Please share this password with the team member. They should use it to login.
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 bg-muted rounded-lg">
              <code className="text-lg font-mono">{tempPassword}</code>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setTempPassword('')}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </DashboardLayout>
  );
};

export default Team;
