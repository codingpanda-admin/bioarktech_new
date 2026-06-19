import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

const emptyProfile = {
  firstName: '',
  lastName: '',
  title: '',
  company: '',
  jobTitle: '',
  mobile: '',
  telephone: '',
  addressLine1: '',
  addressLine2: '',
  aptSuite: '',
  city: '',
  state: '',
  country: 'US',
  zipcode: '',
};

function ProfilePage({ navigate }) {
  const [formData, setFormData] = useState(emptyProfile);
  const [readOnlyData, setReadOnlyData] = useState({
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setStatus({ type: '', message: '' });

      try {
        const user = await apiFetch('/api/users/view-user-info/');
        const address = user.shipping_address || {};

        setFormData({
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          title: user.title || '',
          company: user.company || '',
          jobTitle: user.job_title || '',
          mobile: user.mobile || '',
          telephone: user.telephone || '',
          addressLine1: address.address_line_1 || '',
          addressLine2: address.address_line_2 || '',
          aptSuite: address.apt_suite || '',
          city: address.city || '',
          state: address.state || '',
          country: address.country || 'US',
          zipcode: address.zipcode || '',
        });

        setReadOnlyData({
          email: user.email || '',
        });
      } catch (err) {
        setStatus({ type: 'error', message: err.message || 'Unable to load your profile.' });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handlePasswordInputChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await apiFetch('/api/users/update-user-info/', {
        method: 'POST',
        body: formData,
      });

      if (response.user) {
        const address = response.user.shipping_address || {};
        setFormData((current) => ({
          ...current,
          firstName: response.user.first_name || '',
          lastName: response.user.last_name || '',
          title: response.user.title || '',
          company: response.user.company || '',
          jobTitle: response.user.job_title || '',
          mobile: response.user.mobile || '',
          telephone: response.user.telephone || '',
          addressLine1: address.address_line_1 || '',
          addressLine2: address.address_line_2 || '',
          aptSuite: address.apt_suite || '',
          city: address.city || '',
          state: address.state || '',
          country: address.country || current.country || 'US',
          zipcode: address.zipcode || '',
        }));
      }

      setStatus({ type: 'success', message: 'Profile updated successfully.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Unable to save your profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordSaving(true);
    setPasswordStatus({ type: '', message: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New password and confirmation do not match.' });
      setPasswordSaving(false);
      return;
    }

    try {
      await apiFetch('/api/users/reset-user-password/', {
        method: 'POST',
        body: passwordForm,
      });

      setPasswordStatus({ type: 'success', message: 'Password updated successfully.' });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setPasswordStatus({ type: 'error', message: err.message || 'Unable to update password.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleClosePasswordModal = () => {
    setPasswordModalOpen(false);
    setPasswordStatus({ type: '', message: '' });
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  if (loading) {
    return <div className="spinner" />;
  }

  return (
    <main className="profile-page">
      <section className="profile-header">
        <div>
          <h1>User Profile</h1>
          <p>Update your contact and shipping information.</p>
        </div>
        <button type="button" className="secondary-profile-button" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </section>

      {status.message && (
        <div className={`alert-banner ${status.type}`}>
          {status.message}
        </div>
      )}

      <form className="profile-form" onSubmit={handleSubmit}>
        <section className="profile-section" aria-labelledby="account-fields-title">
          <h2 id="account-fields-title">Account</h2>
          <div className="profile-grid">
            <label>
              Email
              <input type="email" value={readOnlyData.email} disabled />
            </label>
          </div>
          <button type="button" className="secondary-profile-button profile-password-button" onClick={() => setPasswordModalOpen(true)}>
            Change Password
          </button>
        </section>

        <section className="profile-section" aria-labelledby="editable-fields-title">
          <h2 id="editable-fields-title">Contact Information</h2>
          <div className="profile-grid">
            <label>
              First Name
              <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} />
            </label>
            <label>
              Last Name
              <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} />
            </label>
            <label>
              Title
              <input type="text" name="title" value={formData.title} onChange={handleInputChange} />
            </label>
            <label>
              Company
              <input type="text" name="company" value={formData.company} onChange={handleInputChange} />
            </label>
            <label>
              Job Title
              <input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleInputChange} />
            </label>
            <label>
              Mobile
              <input type="tel" name="mobile" value={formData.mobile} onChange={handleInputChange} />
            </label>
            <label>
              Telephone
              <input type="tel" name="telephone" value={formData.telephone} onChange={handleInputChange} />
            </label>
          </div>
        </section>

        <section className="profile-section" aria-labelledby="shipping-fields-title">
          <h2 id="shipping-fields-title">Shipping Address</h2>
          <div className="profile-grid">
            <label className="full-span">
              Address Line 1
              <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} />
            </label>
            <label className="full-span">
              Address Line 2
              <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleInputChange} />
            </label>
            <label>
              Apt / Suite
              <input type="text" name="aptSuite" value={formData.aptSuite} onChange={handleInputChange} />
            </label>
            <label>
              City
              <input type="text" name="city" value={formData.city} onChange={handleInputChange} />
            </label>
            <label>
              State
              <input type="text" name="state" value={formData.state} onChange={handleInputChange} />
            </label>
            <label>
              Country
              <input type="text" name="country" value={formData.country} onChange={handleInputChange} />
            </label>
            <label>
              ZIP Code
              <input type="text" name="zipcode" value={formData.zipcode} onChange={handleInputChange} />
            </label>
          </div>
        </section>

        <div className="profile-actions">
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>

      {passwordModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="change-password-title" onClick={handleClosePasswordModal}>
          <div className="profile-password-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={handleClosePasswordModal}>&times;</button>
            <h2 id="change-password-title">Change Password</h2>

            {passwordStatus.message && (
              <div className={`alert-banner ${passwordStatus.type}`}>
                {passwordStatus.message}
              </div>
            )}

            <form className="profile-password-form" onSubmit={handlePasswordSubmit}>
              <label>
                Current Password
                <input type="password" name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordInputChange} required />
              </label>
              <label>
                New Password
                <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordInputChange} required />
              </label>
              <label>
                Confirm New Password
                <input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordInputChange} required />
              </label>
              <div className="profile-password-actions">
                <button type="button" className="secondary-profile-button" onClick={handleClosePasswordModal}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={passwordSaving}>
                  {passwordSaving ? 'Saving...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default ProfilePage;
