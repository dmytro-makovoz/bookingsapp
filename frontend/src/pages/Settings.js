import React, { useState } from 'react';
import { Users, BookOpen, Layers, Tag, Calendar } from 'lucide-react';
import Layout from '../components/Layout';
import BusinessTypes from './BusinessTypes';
import ContentSizes from './ContentSizes';
import ContentTypes from './ContentTypes';
import Magazines from './Magazines';
import Schedules from './Schedules';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('business-types');

  const tabs = [
    {
      id: 'business-types',
      name: 'Business Types',
      icon: Users,
      component: BusinessTypes
    },
    {
      id: 'content-sizes',
      name: 'Content Sizes',
      icon: Layers,
      component: ContentSizes
    },
    {
      id: 'content-types',
      name: 'Content Types',
      icon: Tag,
      component: ContentTypes
    },
    {
      id: 'magazines',
      name: 'Magazines',
      icon: BookOpen,
      component: Magazines
    },
    {
      id: 'schedules',
      name: 'Schedules',
      icon: Calendar,
      component: Schedules
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage your business types, content sizes, content types, magazines, and schedules.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {ActiveComponent && <ActiveComponent />}
        </div>
      </div>
    </Layout>
  );
};

export default Settings; 