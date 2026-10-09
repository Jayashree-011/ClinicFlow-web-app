import React from 'react';
import { UserPlus, Users, CheckCircle, AlertCircle, Plus, Trash2, Clock, User, Mail, Phone } from 'lucide-react';
import { FamilyMember } from './types';
import { fmtDate } from './utils';

interface NewMemberForm {
  name: string; relationship: string; dob: string;
  gender: string; email: string; phone: string;
}

interface Props {
  familyMembers:   FamilyMember[];
  showAddMember:   boolean;
  memberSaving:    boolean;
  memberError:     string;
  memberSuccess:   string;
  newMember:       NewMemberForm;
  setShowAddMember: (v: boolean | ((prev: boolean) => boolean)) => void;
  setNewMember:    (v: NewMemberForm | ((prev: NewMemberForm) => NewMemberForm)) => void;
  setMemberError:  (v: string) => void;
  handleAddMember: (e: React.FormEvent) => void;
  handleDeleteMember: (id: number) => void;
}

const REL_COLORS: Record<string, string> = {
  Spouse:      'bg-pink-50 text-pink-600 border-pink-100',
  Parent:      'bg-purple-50 text-purple-600 border-purple-100',
  Child:       'bg-blue-50 text-blue-600 border-blue-100',
  Sibling:     'bg-indigo-50 text-indigo-600 border-indigo-100',
  Grandparent: 'bg-amber-50 text-amber-600 border-amber-100',
  Grandchild:  'bg-emerald-50 text-emerald-600 border-emerald-100',
  Other:       'bg-slate-100 text-slate-600 border-slate-200',
};

export default function FamilyTab({
  familyMembers, showAddMember, memberSaving, memberError, memberSuccess,
  newMember, setShowAddMember, setNewMember, setMemberError,
  handleAddMember, handleDeleteMember,
}: Props) {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Family Members</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {familyMembers.length} registered member{familyMembers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setShowAddMember(v => !v); setMemberError(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-500/20 transition-colors">
          <UserPlus size={15} />
          {showAddMember ? 'Cancel' : 'Add Member'}
        </button>
      </div>

      {memberSuccess && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium px-4 py-2.5 rounded-xl mb-4">
          <CheckCircle className="w-4 h-4 shrink-0" /> {memberSuccess}
        </div>
      )}
      {memberError && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-medium px-4 py-2.5 rounded-xl mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" /> {memberError}
        </div>
      )}

      {/* Add member form */}
      {showAddMember && (
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Register Family Member</h2>
          </div>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Full Name <span className="text-rose-400">*</span></label>
                <input type="text" value={newMember.name}
                  onChange={e => setNewMember(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium"
                  required />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Relationship</label>
                <select value={newMember.relationship}
                  onChange={e => setNewMember(f => ({ ...f, relationship: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium appearance-none">
                  <option value="">Select relationship</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Child">Child</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Grandparent">Grandparent</option>
                  <option value="Grandchild">Grandchild</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Date of Birth</label>
                <input type="date" value={newMember.dob}
                  onChange={e => setNewMember(f => ({ ...f, dob: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Gender</label>
                <select value={newMember.gender}
                  onChange={e => setNewMember(f => ({ ...f, gender: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium appearance-none">
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email</label>
                <input type="email" value={newMember.email}
                  onChange={e => setNewMember(f => ({ ...f, email: e.target.value }))}
                  placeholder="optional"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone</label>
                <input type="text" value={newMember.phone}
                  onChange={e => setNewMember(f => ({ ...f, phone: e.target.value }))}
                  placeholder="optional"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button type="button"
                onClick={() => { setShowAddMember(false); setMemberError(''); }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={memberSaving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/10 transition-colors disabled:opacity-60">
                <Plus size={14} />
                {memberSaving ? 'Saving…' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Member list */}
      {familyMembers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Users className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No family members registered</p>
            <p className="text-xs text-slate-400 max-w-xs text-center">
              Add family members to manage their health records from your account.
            </p>
            <button onClick={() => setShowAddMember(true)}
              className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors">
              <UserPlus size={14} /> Add your first member
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {familyMembers.map(member => {
            const mi = (member.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            const relCls = REL_COLORS[member.relationship] ?? REL_COLORS['Other'];
            return (
              <div key={member.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold shrink-0">
                      {mi}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-tight">{member.name}</p>
                      {member.mrn && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{member.mrn}</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteMember(member.id)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>

                {member.relationship && (
                  <span className={`self-start text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${relCls}`}>
                    {member.relationship}
                  </span>
                )}

                <div className="space-y-1.5 text-xs text-slate-500">
                  {member.dob && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      <span>DOB: {fmtDate(member.dob)}</span>
                    </div>
                  )}
                  {member.gender && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      <span>{member.gender}</span>
                    </div>
                  )}
                  {member.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}
                  {member.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      <span>{member.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
