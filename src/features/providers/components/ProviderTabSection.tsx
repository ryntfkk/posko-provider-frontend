// src/features/providers/components/ProviderTabSection.tsx

import { Provider } from '../types';
import { ServiceItem, TabType } from './types';
import { ServiceIcon, GalleryIcon } from './Icons';
import ProviderServicesContent from './ProviderServicesContent';
import ProviderDocumentationContent from './ProviderDocumentationContent';

interface ProviderTabSectionProps {
  provider: Provider;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onSelectService: (service: ServiceItem) => void;
  onImageClick: (imageUrl: string) => void;
}

export default function ProviderTabSection({
  provider,
  activeTab,
  onTabChange,
  onSelectService,
  onImageClick,
}: ProviderTabSectionProps) {
  const activeServicesCount = (provider.services as ServiceItem[]).filter((s) => s.isActive).length;
  const portfolioCount = provider.portfolioImages?.length || 0;

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5">
        <div className="flex gap-1">
          <button
            onClick={() => onTabChange('services')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'services' ? 'bg-red-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ServiceIcon />
            <span>Daftar Layanan</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === 'services' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {activeServicesCount}
            </span>
          </button>
          <button
            onClick={() => onTabChange('documentation')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'documentation' ? 'bg-red-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <GalleryIcon />
            <span>Dokumentasi</span>
            {portfolioCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === 'documentation' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {portfolioCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === 'services' && <ProviderServicesContent provider={provider} onSelectService={onSelectService} />}
        {activeTab === 'documentation' && (
          <ProviderDocumentationContent provider={provider} onImageClick={onImageClick} />
        )}
      </div>
    </div>
  );
}