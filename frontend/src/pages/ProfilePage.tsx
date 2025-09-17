import React, { useState } from 'react';
import { User, Lock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import UserProfileForm from '../components/Auth/UserProfileForm';
import ChangePasswordForm from '../components/Auth/ChangePasswordForm';

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const navigate = useNavigate();

  const tabs = [
    {
      id: 'profile' as const,
      label: 'Información Personal',
      icon: User,
    },
    {
      id: 'password' as const,
      label: 'Cambiar Contraseña',
      icon: Lock,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600">
            Gestiona tu información personal y configuración de cuenta
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Volver
        </Button>
      </div>

      {/* Tabs */}
      <Card>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <UserProfileForm
              showCard={false}
              onSuccess={() => {
                // Could show a success message or redirect
              }}
            />
          )}

          {activeTab === 'password' && (
            <ChangePasswordForm
              showCard={false}
              onSuccess={() => {
                // Could switch back to profile tab or show success
                setActiveTab('profile');
              }}
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;