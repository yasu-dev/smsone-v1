import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import UrlAnalytics from './UrlAnalytics';
import MessageAnalytics from './MessageAnalytics';
import SurveyAnalytics from './SurveyAnalytics';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';

const AnalyticsDashboard: React.FC = () => {
  const location = useLocation();
  const { url } = useParams<{ url: string }>();
  const [activeTab, setActiveTab] = useState('message');
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [urlData, setUrlData] = useState<any>(null);

  useEffect(() => {
    // locationのstateからタブを取得
    const state = location.state as { tab?: string } | null;
    if (state?.tab) {
      setActiveTab(state.tab);
    }
    
    // URLパラメータからURLを取得
    if (url) {
      setSelectedUrl(decodeURIComponent(url));
    }
  }, [location, url]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-grey-200">
        <Tabs defaultValue="message" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            <TabsTrigger value="message">メッセージ分析</TabsTrigger>
            <TabsTrigger value="url">URL分析</TabsTrigger>
            <TabsTrigger value="survey">アンケート分析</TabsTrigger>
          </TabsList>
          
          <TabsContent value="message" className="mt-2">
            <MessageAnalytics />
          </TabsContent>
          
          <TabsContent value="url" className="mt-2">
            <UrlAnalytics selectedUrl={selectedUrl} urlData={urlData} />
          </TabsContent>
          
          <TabsContent value="survey" className="mt-2">
            <SurveyAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 