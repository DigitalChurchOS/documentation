import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, LogIn, UserPlus } from 'lucide-react';
import type { Tenant } from '../../../types';
import { loadMemberSession, loginMember, registerMember } from '../../../memberAccount';
import { withLocalChurchBase } from '../../../routing';
import './MemberPortal.css';

interface Props {
  tenant: Tenant;
}

const MemberAuthPage: React.FC<Props> = ({ tenant }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'login' | 'join'>('login');
  const [loadingAction, setLoadingAction] = useState<'login' | 'register' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    const session = loadMemberSession();
    if (session && (!tenant.id || session.tenantId === tenant.id)) {
      navigate(withLocalChurchBase('/account'), { replace: true });
    }
  }, [navigate, tenant.id]);

  const selectTab = (tab: 'login' | 'join') => {
    setActiveTab(tab);
    setMessage(null);
    setError(null);
  };

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoadingAction('login');
    setError(null);
    setMessage(null);

    try {
      await loginMember(tenant, loginForm.email, loginForm.password);
      setMessage('Signed in.');
      navigate(withLocalChurchBase('/account'));
    } catch (err: any) {
      setError(err.message || 'Unable to sign in');
    } finally {
      setLoadingAction(null);
    }
  };

  const submitRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoadingAction('register');
    setError(null);
    setMessage(null);

    try {
      await registerMember(tenant, registerForm);
      setMessage('Account created.');
      navigate(withLocalChurchBase('/account'));
    } catch (err: any) {
      setError(err.message || 'Unable to create account');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="member-auth-page">
      <section className="member-auth-preview member-auth-split section">
        <div className="member-auth-copy">
          <div className="section-kicker">Member access</div>
          <h1>Welcome to your secure church account.</h1>
          <p className="lead">
            Sign in to view giving records, group connections, courses, event registrations,
            attendance, and profile preferences.
          </p>
          <Link className="btn btn-soft" to={withLocalChurchBase('/')}>
            <Home size={16} /> Home
          </Link>
        </div>

        <article className="member-auth-card member-auth-card--single">
          <div className="member-tabs" role="tablist" aria-label="Member account mode">
            <button
              className={activeTab === 'login' ? 'active' : ''}
              type="button"
              onClick={() => selectTab('login')}
            >
              Sign In
            </button>
            <button
              className={activeTab === 'join' ? 'active' : ''}
              type="button"
              onClick={() => selectTab('join')}
            >
              Join
            </button>
          </div>

          {(message || error) && (
            <div className={`member-alert member-alert--inline ${error ? 'error' : ''}`}>{error || message}</div>
          )}

          {activeTab === 'login' ? (
            <form className="member-form-preview" onSubmit={submitLogin}>
              <div className="member-card-heading">
                <span className="section-kicker">Sign in</span>
                <h2>Access your profile.</h2>
              </div>
              <label>
                Email
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((form) => ({ ...form, email: event.target.value }))}
                  autoComplete="email"
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((form) => ({ ...form, password: event.target.value }))}
                  autoComplete="current-password"
                  minLength={8}
                  required
                />
              </label>
              <button className="btn btn-primary" type="submit" disabled={loadingAction === 'login'}>
                <LogIn size={16} /> {loadingAction === 'login' ? 'Signing In' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form className="member-form-preview two-col" onSubmit={submitRegister}>
              <div className="member-card-heading full">
                <span className="section-kicker">Create profile</span>
                <h2>Join your church online.</h2>
              </div>
              <label>
                First name
                <input
                  value={registerForm.firstName}
                  onChange={(event) => setRegisterForm((form) => ({ ...form, firstName: event.target.value }))}
                  autoComplete="given-name"
                  required
                />
              </label>
              <label>
                Last name
                <input
                  value={registerForm.lastName}
                  onChange={(event) => setRegisterForm((form) => ({ ...form, lastName: event.target.value }))}
                  autoComplete="family-name"
                  required
                />
              </label>
              <label>
                Phone
                <input
                  value={registerForm.phone}
                  onChange={(event) => setRegisterForm((form) => ({ ...form, phone: event.target.value }))}
                  autoComplete="tel"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(event) => setRegisterForm((form) => ({ ...form, email: event.target.value }))}
                  autoComplete="email"
                  required
                />
              </label>
              <label className="full">
                Password
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm((form) => ({ ...form, password: event.target.value }))}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
              <button className="btn btn-primary full" type="submit" disabled={loadingAction === 'register'}>
                <UserPlus size={16} /> {loadingAction === 'register' ? 'Creating Account' : 'Create Account'}
              </button>
            </form>
          )}
        </article>
      </section>
    </div>
  );
};

export default MemberAuthPage;
