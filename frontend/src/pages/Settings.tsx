import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';

interface UserSettings {
  theme: string;
  currency: string;
  dateFormat: string;
  notificationsEnabled: boolean;
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Profile state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Settings state
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'light',
    currency: 'USD',
    dateFormat: 'YYYY-MM-DD',
    notificationsEnabled: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/auth/settings');
      if (response.data.settings) {
        setSettings({
          theme: response.data.settings.theme,
          currency: response.data.settings.currency,
          dateFormat: response.data.settings.date_format,
          notificationsEnabled: response.data.settings.notifications_enabled,
        });
      }
    } catch (error) {
      console.error('Load settings error:', error);
    }
  };

  const saveProfile = async () => {
    try {
      setSavingProfile(true);
      await axios.put('http://localhost:3001/api/auth/profile', {
        fullName,
      });
      alert('Profile updated successfully!');
    } catch (error: any) {
      console.error('Save profile error:', error);
      alert(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    setPasswordError('');

    // Validation
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      setChangingPassword(true);
      await axios.post('http://localhost:3001/api/auth/change-password', {
        currentPassword,
        newPassword,
      });

      alert('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Change password error:', error);
      setPasswordError(error.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSavingSettings(true);
      await axios.put('http://localhost:3001/api/auth/settings', {
        theme: settings.theme,
        currency: settings.currency,
        dateFormat: settings.dateFormat,
        notificationsEnabled: settings.notificationsEnabled,
      });
      alert('Settings saved successfully!');
    } catch (error: any) {
      console.error('Save settings error:', error);
      alert(error.response?.data?.error || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const deleteAccount = async () => {
    if (
      !confirm(
        'Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently deleted.'
      )
    ) {
      return;
    }

    if (!confirm('This is your final warning. Delete account?')) {
      return;
    }

    alert('Account deletion is not implemented yet. Please contact support.');
  };

  return (
    <div>
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        {/* Profile Settings */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:opacity-50"
            >
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Change Password</h2>

          {passwordError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{passwordError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              onClick={changePassword}
              disabled={changingPassword}
              className="px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:opacity-50"
            >
              {changingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>

        {/* App Settings */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Preferences</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <select
                value={settings.theme}
                onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
              <select
                value={settings.dateFormat}
                onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifications"
                checked={settings.notificationsEnabled}
                onChange={(e) =>
                  setSettings({ ...settings, notificationsEnabled: e.target.checked })
                }
                className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
              />
              <label htmlFor="notifications" className="ml-2 block text-sm text-gray-900">
                Enable notifications
              </label>
            </div>

            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:opacity-50"
            >
              {savingSettings ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-900 mb-4">Danger Zone</h2>
          <p className="text-sm text-red-700 mb-4">
            Once you delete your account, there is no going back. All your data will be permanently
            deleted.
          </p>
          <button
            onClick={deleteAccount}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
