'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function PackFormClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isDefault: false,
    systemPromptEn: '',
    systemPromptFa: '',
    welcomeMessageEn: '',
    welcomeMessageFa: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('✓ Character pack created successfully!');
        router.push(`/packs/${data.id}`);
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to create pack');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to create pack');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pack Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="e.g., Professional Assistant"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Describe this character pack..."
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isDefault"
            checked={formData.isDefault}
            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
          />
          <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
            Set as default pack for new users
          </label>
        </div>
      </div>

      {/* System Prompts */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Prompts</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            English System Prompt *
          </label>
          <textarea
            required
            value={formData.systemPromptEn}
            onChange={(e) => setFormData({ ...formData, systemPromptEn: e.target.value })}
            rows={10}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
            placeholder="Enter the system prompt for English users..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Persian/Farsi System Prompt
          </label>
          <textarea
            value={formData.systemPromptFa}
            onChange={(e) => setFormData({ ...formData, systemPromptFa: e.target.value })}
            rows={10}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
            placeholder="پیام سیستم برای کاربران فارسی‌زبان..."
            dir="rtl"
          />
        </div>
      </div>

      {/* Welcome Messages */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome Messages</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            English Welcome Message *
          </label>
          <textarea
            required
            value={formData.welcomeMessageEn}
            onChange={(e) => setFormData({ ...formData, welcomeMessageEn: e.target.value })}
            rows={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="👋 Hi {name}!&#10;&#10;Welcome message for English users..."
          />
          <p className="mt-1 text-sm text-gray-500">Use {'{name}'} placeholder for user's name</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Persian/Farsi Welcome Message
          </label>
          <textarea
            value={formData.welcomeMessageFa}
            onChange={(e) => setFormData({ ...formData, welcomeMessageFa: e.target.value })}
            rows={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="👋 سلام {name}!&#10;&#10;پیام خوشامدگویی برای کاربران فارسی‌زبان..."
            dir="rtl"
          />
          <p className="mt-1 text-sm text-gray-500" dir="rtl">از {'{name}'} برای نام کاربر استفاده کنید</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? 'Creating...' : 'Create Pack'}
        </button>
      </div>
    </form>
  );
}
