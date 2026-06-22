import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import type { Tenant } from '../../../types';
import { loginMember, registerMember } from '../../../memberAccount';
import { withLocalChurchBase } from '../../../routing';
import './MemberPortal.css';

interface Props {
  tenant: Tenant;
}

const MemberAuthPage: React.FC<Props> = ({ tenant }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'login') {
        await loginMember(tenant, form.email, form.password);
        setMessage('Signed in.');
      } else {
        await registerMember(tenant, {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          password: form.password,
        });
        setMessage('Account created.');
      }
      navigate(withLocalChurchBase('/account'));
    } catch (err: any) {
      setError(err.message || 'Unable to continue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="member-auth-wrap">
      <section className="member-auth">
        <div className="member-auth__copy">
          <p className="member-auth__eyebrow">{tenant.name}</p>
          <h1>Member Account</h1>
          <p className="member-auth__subtitle">
            Welcome to your secure church account.
          </p>
        </div>

        <form className="member-auth__form" onSubmit={submit}>
          <div className="member-auth__tabs" role="tablist" aria-label="Member account mode">
            <button
              type="button"
              className={`member-auth__tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`member-auth__tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => setMode('register')}
            >
              Join
            </button>
          </div>

          {mode === 'register' && (
            <>
              <label>
                First name
                <input
                  value={form.firstName}
                  onChange={(event) => updateField('firstName', event.target.value)}
                  autoComplete="given-name"
                  required
                />
              </label>
              <label>
                Last name
                <input
                  value={form.lastName}
                  onChange={(event) => updateField('lastName', event.target.value)}
                  autoComplete="family-name"
                  required
                />
              </label>
              <label>
                Phone
                <input
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  autoComplete="tel"
                />
              </label>
            </>
          )}

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={8}
              required
            />
          </label>

          {error && <div className="member-alert error">{error}</div>}
          {message && <div className="member-alert">{message}</div>}

          <div className="member-auth__actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
              {loading ? 'Please wait' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
            <Link className="btn btn-soft" to={withLocalChurchBase('/')}>
              Home
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
};

export default MemberAuthPage;
