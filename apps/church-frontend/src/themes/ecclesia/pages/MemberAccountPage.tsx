import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Download,
  Edit3,
  Gift,
  GraduationCap,
  ListFilter,
  LogIn,
  LogOut,
  Save,
  ShieldCheck,
  UsersRound,
  X,
} from 'lucide-react';
import type { Tenant } from '../../../types';
import {
  clearMemberSession,
  fetchMemberAccount,
  loadMemberSession,
  updateMemberPreferences,
  updateMemberProfile,
  type MemberAccountResponse,
  type MemberSession,
} from '../../../memberAccount';
import { withLocalChurchBase } from '../../../routing';
import './MemberPortal.css';

interface Props {
  tenant: Tenant;
}

type ContributionFilter = {
  from: string;
  to: string;
  min: string;
  max: string;
};

function formatDate(value?: string | null): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateInput(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function formatMoney(amount?: number, currency = 'USD'): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

function getInitials(firstName?: string, lastName?: string): string {
  return `${firstName?.trim()[0] || ''}${lastName?.trim()[0] || ''}`.toUpperCase() || 'ME';
}

function memberBio(member: any, tenant: Tenant): string {
  return member.bio || member.about || `Member of ${tenant.name}. Keep your contact details, giving records, group connections, courses, events, and preferences in one secure place.`;
}

function contributionDate(value: any): string {
  const date = new Date(value?.createdAt || value?.paidAt || value?.date || '');
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function ListBlock({
  empty,
  emptyText = 'No records yet.',
  children,
}: {
  empty: boolean;
  emptyText?: string;
  children: React.ReactNode;
}) {
  if (empty) return <div className="member-empty">{emptyText}</div>;
  return <div className="member-list">{children}</div>;
}

const MemberAccountPage: React.FC<Props> = ({ tenant }) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<MemberSession | null>(() => loadMemberSession());
  const [account, setAccount] = useState<MemberAccountResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [contributionModalOpen, setContributionModalOpen] = useState(false);
  const [contributionFilter, setContributionFilter] = useState<ContributionFilter>({
    from: '',
    to: '',
    min: '',
    max: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthday: '',
    address: '',
    bio: '',
    photoUrl: '',
  });
  const [preferences, setPreferences] = useState({
    preferEmail: true,
    preferSms: false,
    preferPush: true,
    preferWhatsapp: false,
  });

  useEffect(() => {
    const current = loadMemberSession();
    if (!current || current.tenantId !== tenant.id) {
      setSession(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);
    fetchMemberAccount(current.tenantId, current.token)
      .then((data) => {
        if (!active) return;
        setAccount(data);
        setProfileForm({
          firstName: data.member.firstName || '',
          lastName: data.member.lastName || '',
          email: data.member.email || data.member.user?.email || current.user.email || '',
          phone: data.member.phone || '',
          birthday: formatDateInput(data.member.birthday),
          address: data.member.address || '',
          bio: memberBio(data.member, tenant),
          photoUrl: data.member.photoUrl || '',
        });
        const pref = data.member.notificationPref || {};
        setPreferences({
          preferEmail: pref.preferEmail ?? true,
          preferSms: pref.preferSms ?? false,
          preferPush: pref.preferPush ?? true,
          preferWhatsapp: pref.preferWhatsapp ?? false,
        });
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Unable to load account');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tenant]);

  const allContributions = useMemo(() => {
    const donations = account?.giving?.donations || [];
    const partnerships = account?.giving?.partnerships || [];
    return [...donations, ...partnerships]
      .map((gift: any) => ({
        ...gift,
        contributionDate: contributionDate(gift),
        label: gift.category?.name || gift.fund || gift.title || 'Giving',
        method: gift.method || gift.paymentMethod || gift.source || 'Online',
      }))
      .sort((a, b) => Date.parse(b.createdAt || b.date || '') - Date.parse(a.createdAt || a.date || ''));
  }, [account]);

  const filteredContributions = useMemo(() => {
    const min = contributionFilter.min ? Number(contributionFilter.min) : 0;
    const max = contributionFilter.max ? Number(contributionFilter.max) : Number.POSITIVE_INFINITY;
    return allContributions.filter((gift: any) => {
      const date = gift.contributionDate;
      const amount = Number(gift.amount || 0);
      const matchesFrom = !contributionFilter.from || date >= contributionFilter.from;
      const matchesTo = !contributionFilter.to || date <= contributionFilter.to;
      return matchesFrom && matchesTo && amount >= min && amount <= max;
    });
  }, [allContributions, contributionFilter]);

  const givingBuckets = useMemo(() => {
    const buckets = new Map<string, { label: string; amount: number; currency: string }>();
    allContributions.forEach((gift: any) => {
      const key = gift.label || 'Giving';
      const current = buckets.get(key) || { label: key, amount: 0, currency: gift.currency || 'USD' };
      current.amount += Number(gift.amount || 0);
      buckets.set(key, current);
    });
    return Array.from(buckets.values()).slice(0, 4);
  }, [allContributions]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await updateMemberProfile(session.tenantId, session.token, profileForm);
      setAccount((current) => current ? { ...current, member: { ...current.member, ...updated } } : current);
      setEditingProfile(false);
      setMessage('Profile updated.');
    } catch (err: any) {
      setError(err.message || 'Unable to save profile');
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async () => {
    if (!session) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await updateMemberPreferences(session.tenantId, session.token, preferences);
      setAccount((current) => current ? { ...current, member: { ...current.member, notificationPref: updated } } : current);
      setMessage('Communication preferences saved.');
    } catch (err: any) {
      setError(err.message || 'Unable to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const signOut = () => {
    clearMemberSession();
    setSession(null);
    navigate(withLocalChurchBase('/login'));
  };

  if (!session) {
    return (
      <div className="member-portal">
        <section className="member-template-hero">
          <div>
            <div className="section-kicker">{tenant.name}</div>
            <h1>Member Account</h1>
            <p className="lead">Sign in or create your profile to view your church records.</p>
          </div>
          <Link className="btn btn-primary" to={withLocalChurchBase('/login')}>
            <LogIn size={16} /> Sign In
          </Link>
        </section>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="member-portal">
        <div className="member-empty">Loading account...</div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="member-portal">
        <div className="member-alert error">{error || 'Unable to load account.'}</div>
        <button className="btn btn-primary" type="button" onClick={signOut}>Sign In Again</button>
      </div>
    );
  }

  const member = account.member;
  const settings = account.settings || {};
  const groups = member.groupMemberships || [];
  const courses = member.lmsEnrollments || [];
  const certificates = courses.filter((enrollment: any) => (
    String(enrollment.status || '').toLowerCase().includes('complete') ||
    Number(enrollment.progressPercent || 0) >= 100
  ));
  const events = member.eventRegistrations || [];
  const checkIns = member.checkIns || [];
  const initials = getInitials(member.firstName, member.lastName);
  const totalGiven = account.giving?.totalGiven || allContributions.reduce((sum, gift: any) => sum + Number(gift.amount || 0), 0);
  const contributionTotal = filteredContributions.reduce((sum, gift: any) => sum + Number(gift.amount || 0), 0);

  return (
    <div className="member-portal member-account-page">
      <section className="member-account-hero">
        <div>
          <div className="portal-avatar-wrap">
            <div className="portal-avatar" aria-hidden="true">
              {member.photoUrl ? <img src={member.photoUrl} alt="" /> : initials}
            </div>
            <div>
              <h1>{member.firstName} {member.lastName}</h1>
            </div>
          </div>
          <p>{memberBio(member, tenant)}</p>
        </div>
        <div className="member-stat-strip">
          <div><span>Total Invites</span><strong>{member.totalInvites || 0}</strong></div>
          <div><span>Total Converts</span><strong>{member.totalConverts || 0}</strong></div>
        </div>
      </section>

      {(message || error) && (
        <div className={`member-alert ${error ? 'error' : ''}`}>{error || message}</div>
      )}

      <section className="member-dashboard-preview section">
        <article className="member-panel member-profile-panel">
          <div className="member-panel-head">
            <h2>Profile Details</h2>
            <span>Joined {formatDate(member.createdAt)}</span>
          </div>

          {!editingProfile ? (
            <div>
              <div className="profile-summary-row">
                <div className="profile-photo-slot">
                  {member.photoUrl ? <img src={member.photoUrl} alt={`${member.firstName} ${member.lastName}`} /> : initials}
                </div>
                <div>
                  <span className="portal-badge"><ShieldCheck size={15} /> {member.membershipStatus || 'Member'}</span>
                  <p className="profile-summary-meta">Member since {formatDate(member.createdAt)}</p>
                </div>
              </div>

              <dl className="profile-detail-grid">
                <div className="profile-detail"><dt>First name</dt><dd>{member.firstName || 'Not recorded'}</dd></div>
                <div className="profile-detail"><dt>Last name</dt><dd>{member.lastName || 'Not recorded'}</dd></div>
                <div className="profile-detail"><dt>Email</dt><dd>{member.email || session.user.email}</dd></div>
                <div className="profile-detail"><dt>Phone</dt><dd>{member.phone || 'Not recorded'}</dd></div>
                <div className="profile-detail"><dt>Birth date</dt><dd>{formatDate(member.birthday)}</dd></div>
                <div className="profile-detail"><dt>Membership status</dt><dd>{member.membershipStatus || 'Member'}</dd></div>
                <div className="profile-detail full"><dt>Bio / About me</dt><dd>{memberBio(member, tenant)}</dd></div>
                <div className="profile-detail full"><dt>Address</dt><dd>{member.address || 'Not recorded'}</dd></div>
              </dl>

              <div className="profile-actions">
                <button className="btn btn-primary" type="button" onClick={() => setEditingProfile(true)}>
                  <Edit3 size={16} /> Edit Profile
                </button>
              </div>
            </div>
          ) : (
            <form className="member-form-preview two-col" onSubmit={saveProfile}>
              <div className="profile-edit-photo-row">
                <div className="profile-photo-slot">
                  {profileForm.photoUrl ? <img src={profileForm.photoUrl} alt="" /> : getInitials(profileForm.firstName, profileForm.lastName)}
                </div>
                <label className="full">Profile photo<input value={profileForm.photoUrl} onChange={(event) => setProfileForm((f) => ({ ...f, photoUrl: event.target.value }))} placeholder="Paste profile image URL" /></label>
              </div>
              <label>First name<input value={profileForm.firstName} onChange={(event) => setProfileForm((f) => ({ ...f, firstName: event.target.value }))} required /></label>
              <label>Last name<input value={profileForm.lastName} onChange={(event) => setProfileForm((f) => ({ ...f, lastName: event.target.value }))} required /></label>
              <label>Email<input type="email" value={profileForm.email} onChange={(event) => setProfileForm((f) => ({ ...f, email: event.target.value }))} required /></label>
              <label>Phone<input value={profileForm.phone} onChange={(event) => setProfileForm((f) => ({ ...f, phone: event.target.value }))} /></label>
              <label>Birth date<input type="date" value={profileForm.birthday} onChange={(event) => setProfileForm((f) => ({ ...f, birthday: event.target.value }))} /></label>
              <label>Membership status<input value={member.membershipStatus || 'Member'} disabled /></label>
              <label className="full">Bio / About me<textarea value={profileForm.bio} onChange={(event) => setProfileForm((f) => ({ ...f, bio: event.target.value }))} /></label>
              <label className="full">Address<input value={profileForm.address} onChange={(event) => setProfileForm((f) => ({ ...f, address: event.target.value }))} /></label>
              <button className="btn btn-primary" type="submit" disabled={saving}><Save size={16} /> {saving ? 'Updating' : 'Update Profile'}</button>
              <button className="btn btn-soft" type="button" onClick={() => setEditingProfile(false)}><X size={16} /> Cancel</button>
            </form>
          )}
        </article>

        <article className="member-panel">
          <h2>Course Certificates</h2>
          <p className="member-panel-note">Issued upon completion of spiritual growth modules.</p>
          <ListBlock empty={certificates.length === 0} emptyText="Completed certificates will appear here.">
            {certificates.map((enrollment: any) => (
              <div className="certificate-card" key={enrollment.id}>
                <div className="certificate-info">
                  <Award className="certificate-icon" size={22} />
                  <div>
                    <span className="certificate-title">{enrollment.course?.title || 'Course Certificate'}</span>
                    <span className="certificate-date">Completed {formatDate(enrollment.completedAt || enrollment.updatedAt || enrollment.createdAt)}</span>
                  </div>
                </div>
                <a className="certificate-btn" href={enrollment.certificateUrl || '#'}><Download size={14} /> Certificate</a>
              </div>
            ))}
          </ListBlock>
        </article>

        <article className="member-panel">
          <h2>My Groups</h2>
          <p className="member-panel-note">Your active fellowships and group involvements.</p>
          <ListBlock empty={!settings.showGroupMemberships || groups.length === 0} emptyText="Your group connections will appear here.">
            {groups.map((membership: any) => (
              <div className="member-access-row" key={membership.id}>
                <strong><UsersRound size={16} /> {membership.group?.name || 'Group'}</strong>
                <span className="portal-badge soft"><CheckCircle2 size={14} /> {membership.role || 'Active'}</span>
              </div>
            ))}
          </ListBlock>
        </article>

        <article className="member-panel">
          <h2>Giving History</h2>
          <p className="member-panel-note">Detailed logs of your online support.</p>
          <ListBlock empty={!settings.showGivingHistory || givingBuckets.length === 0} emptyText="No giving records yet.">
            {givingBuckets.map((bucket) => (
              <div className="giving-summary-row" key={bucket.label}>
                <strong>{bucket.label}</strong>
                <span>{formatMoney(bucket.amount, bucket.currency)}</span>
              </div>
            ))}
          </ListBlock>

          <div className="giving-section-divider" />
          <h3 className="member-section-mini-title">Recent Contributions</h3>
          <ListBlock empty={!settings.showGivingHistory || allContributions.length === 0} emptyText="Recent contributions will appear here.">
            {allContributions.slice(0, 3).map((gift: any) => (
              <div className="transaction-row" key={gift.id || `${gift.label}-${gift.createdAt}`}>
                <div className="transaction-meta">
                  <span className="transaction-title">{gift.label}</span>
                  <span className="transaction-date">{formatDate(gift.createdAt)} - {gift.method}</span>
                </div>
                <div className="transaction-amount">
                  <strong>{formatMoney(gift.amount, gift.currency || 'USD')}</strong>
                  <span><CheckCircle2 size={11} /> {gift.status || 'Success'}</span>
                </div>
              </div>
            ))}
          </ListBlock>
          <button className="btn btn-soft contribution-history-btn" type="button" onClick={() => setContributionModalOpen(true)}>
            <ListFilter size={16} /> View All Contributions
          </button>
        </article>

        <article className="member-panel">
          <h2>Access</h2>
          <p className="member-panel-note">{settings.memberOnlyContent ? 'Member access is active.' : 'Member access is limited.'}</p>
          <div className="member-list">
            <Link className="member-list__item" to={withLocalChurchBase('/giving')}><div className="member-list__row"><strong><Gift size={16} /> Giving</strong><span>{formatMoney(totalGiven)}</span></div></Link>
            <Link className="member-list__item" to={withLocalChurchBase('/courses')}><div className="member-list__row"><strong><GraduationCap size={16} /> Courses</strong><span>{courses.length}</span></div></Link>
            <Link className="member-list__item" to={withLocalChurchBase('/events')}><div className="member-list__row"><strong><CalendarDays size={16} /> Events</strong><span>{events.length}</span></div></Link>
            <Link className="member-list__item" to={withLocalChurchBase('/resources')}><div className="member-list__row"><strong><BookOpen size={16} /> Resources</strong><span>Browse</span></div></Link>
          </div>
        </article>

        <article className="member-panel">
          <h2>Communications</h2>
          <p className="member-panel-note">Manage how your church sends updates.</p>
          <div className="member-check-list">
            {[
              ['preferEmail', 'Email notifications'],
              ['preferSms', 'SMS alerts'],
              ['preferPush', 'Mobile app push'],
              ['preferWhatsapp', 'WhatsApp messages'],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type="checkbox"
                  checked={Boolean(preferences[key as keyof typeof preferences])}
                  onChange={(event) => setPreferences((p) => ({ ...p, [key]: event.target.checked }))}
                />
              </label>
            ))}
          </div>
          <button className="btn btn-primary btn-full" type="button" onClick={savePreferences} disabled={saving}>
            <CheckCircle2 size={16} /> Save Settings
          </button>
        </article>

        <article className="member-panel">
          <h2>Attendance</h2>
          <p className="member-panel-note">{checkIns.length} recent check-ins</p>
          <ListBlock empty={!settings.showAttendanceHistory || checkIns.length === 0}>
            {checkIns.slice(0, 5).map((checkIn: any) => (
              <div className="member-list__item" key={checkIn.id}>
                <div className="member-list__row"><strong>{checkIn.type}</strong><span>{formatDate(checkIn.checkedInAt)}</span></div>
                <div className="member-list__meta">{checkIn.targetId}</div>
              </div>
            ))}
          </ListBlock>
        </article>

        <article className="member-panel">
          <h2>Events</h2>
          <p className="member-panel-note">{events.length} registrations</p>
          <ListBlock empty={!settings.showEventRegistrations || events.length === 0}>
            {events.slice(0, 5).map((registration: any) => (
              <div className="member-list__item" key={registration.id}>
                <div className="member-list__row"><strong>{registration.event?.title || 'Event'}</strong><span>{registration.paymentStatus}</span></div>
                <div className="member-list__meta">{formatDate(registration.event?.startDate || registration.createdAt)}</div>
              </div>
            ))}
          </ListBlock>
        </article>
      </section>

      <section className="account-exit-section section">
        <div className="account-exit-divider" />
        <div className="account-exit-actions">
          <button className="btn btn-soft" type="button" onClick={signOut}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </section>

      {contributionModalOpen && (
        <div className="contribution-modal" onClick={(event) => {
          if (event.target === event.currentTarget) setContributionModalOpen(false);
        }}>
          <div className="contribution-modal-card" role="dialog" aria-modal="true" aria-labelledby="contributionModalTitle">
            <div className="contribution-modal-head">
              <div>
                <h3 id="contributionModalTitle">All Contributions</h3>
                <p>Review giving over time and narrow the record by date or amount.</p>
              </div>
              <button className="btn btn-soft modal-close-btn" type="button" onClick={() => setContributionModalOpen(false)} aria-label="Close contributions">
                <X size={18} />
              </button>
            </div>

            <div className="contribution-filter-grid">
              <label>From<input type="date" value={contributionFilter.from} onChange={(event) => setContributionFilter((f) => ({ ...f, from: event.target.value }))} /></label>
              <label>To<input type="date" value={contributionFilter.to} onChange={(event) => setContributionFilter((f) => ({ ...f, to: event.target.value }))} /></label>
              <label>Min amount<input type="number" min="0" step="1" value={contributionFilter.min} onChange={(event) => setContributionFilter((f) => ({ ...f, min: event.target.value }))} /></label>
              <label>Max amount<input type="number" min="0" step="1" value={contributionFilter.max} onChange={(event) => setContributionFilter((f) => ({ ...f, max: event.target.value }))} /></label>
            </div>

            <div className="contribution-modal-summary">
              <span>{filteredContributions.length} {filteredContributions.length === 1 ? 'record' : 'records'}</span>
              <strong>{formatMoney(contributionTotal, filteredContributions[0]?.currency || 'USD')}</strong>
            </div>
            <div className="contribution-list">
              {filteredContributions.length ? filteredContributions.map((gift: any) => (
                <div className="contribution-history-row" key={gift.id || `${gift.label}-${gift.createdAt}`}>
                  <div>
                    <strong>{gift.label}</strong>
                    <span className="transaction-date">{formatDate(gift.createdAt)} - {gift.method}</span>
                  </div>
                  <span className="amount">{formatMoney(gift.amount, gift.currency || 'USD')}</span>
                </div>
              )) : <p className="member-empty">No contributions match these filters.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberAccountPage;
