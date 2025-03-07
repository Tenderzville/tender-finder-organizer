
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, FileText, Video, BookOpen, Award, CheckCircle } from 'lucide-react';
import { appTranslations } from '@/utils/translations';

// Mock resource data
const RESOURCES = {
  guides: [
    {
      id: "guide-1",
      title: "Getting Started with Public Tenders",
      description: "Learn the basics of finding and applying for public tenders in Kenya",
      author: "Tender Connect Team",
      type: "guide",
      duration: "10 min read",
      difficulty: "Beginner"
    },
    {
      id: "guide-2",
      title: "Understanding AGPO Requirements",
      description: "Detailed guide on the Access to Government Procurement Opportunities program",
      author: "Kenya Public Procurement Authority",
      type: "guide",
      duration: "15 min read",
      difficulty: "Intermediate"
    },
    {
      id: "guide-3",
      title: "Tender Financial Readiness",
      description: "How to prepare financially for tender applications and contract execution",
      author: "Financial Expert Associates",
      type: "guide",
      duration: "12 min read",
      difficulty: "Intermediate"
    }
  ],
  videos: [
    {
      id: "video-1",
      title: "Tender Application Process Walkthrough",
      description: "Step-by-step visual guide to applying for government tenders",
      author: "Tender Connect",
      type: "video",
      duration: "18 minutes",
      difficulty: "Beginner"
    },
    {
      id: "video-2",
      title: "Successful Tender Response Writing",
      description: "Learn how to write compelling and compliant tender responses",
      author: "Procurement Experts Kenya",
      type: "video",
      duration: "25 minutes",
      difficulty: "Intermediate"
    }
  ],
  templates: [
    {
      id: "template-1",
      title: "Standard Tender Application Template",
      description: "Ready-to-use template for standard tender applications",
      author: "Tender Connect",
      type: "template",
      difficulty: "Beginner"
    },
    {
      id: "template-2",
      title: "Bid Bond Request Letter",
      description: "Template for requesting bid bonds from financial institutions",
      author: "Banking Association of Kenya",
      type: "template",
      difficulty: "Beginner"
    },
    {
      id: "template-3",
      title: "Consortium Agreement Template",
      description: "Legal template for forming a consortium with other businesses",
      author: "Legal Consultants Ltd",
      type: "template",
      difficulty: "Advanced"
    }
  ],
  courses: [
    {
      id: "course-1",
      title: "Tender Success Fundamentals",
      description: "Comprehensive course covering all aspects of successful tendering",
      author: "Tender Academy",
      type: "course",
      duration: "5 weeks",
      difficulty: "Beginner to Advanced"
    },
    {
      id: "course-2",
      title: "Financial Management for Government Contracts",
      description: "Learn how to manage finances effectively during contract execution",
      author: "Finance Institute",
      type: "course",
      duration: "3 weeks",
      difficulty: "Intermediate"
    }
  ]
};

const LearningHub: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('guides');
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const [searchQuery, setSearchQuery] = useState('');
  
  const t = appTranslations[language];
  
  const resourceIcons = {
    guide: <FileText className="h-5 w-5" />,
    video: <Video className="h-5 w-5" />,
    template: <FileText className="h-5 w-5" />,
    course: <BookOpen className="h-5 w-5" />
  };
  
  const filteredResources = searchQuery.length > 2
    ? [...RESOURCES.guides, ...RESOURCES.videos, ...RESOURCES.templates, ...RESOURCES.courses].filter(
        resource => 
          resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          resource.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : RESOURCES[activeTab as keyof typeof RESOURCES];
  
  const toggleLanguage = () => {
    setLanguage(lang => lang === 'en' ? 'sw' : 'en');
  };
  
  const renderResourceCard = (resource: any) => (
    <Card key={resource.id} className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          {resourceIcons[resource.type as keyof typeof resourceIcons]}
          <CardTitle className="text-lg">{resource.title}</CardTitle>
        </div>
        <CardDescription>{resource.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 text-sm">
          <div className="bg-muted text-muted-foreground rounded-md px-2 py-1">
            {resource.author}
          </div>
          {resource.duration && (
            <div className="bg-muted text-muted-foreground rounded-md px-2 py-1">
              {resource.duration}
            </div>
          )}
          <div className="bg-muted text-muted-foreground rounded-md px-2 py-1">
            {resource.difficulty}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          {language === 'en' ? "View Resource" : "Angalia Rasilimali"}
        </Button>
      </CardFooter>
    </Card>
  );
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="p-0"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> 
          {language === 'en' ? "Back to Dashboard" : "Rudi kwenye Dashibodi"}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={toggleLanguage}
        >
          {language === 'en' ? "Switch to Kiswahili" : "Badili kwa Kiingereza"}
        </Button>
      </div>
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">{t.learning}</h1>
        <p className="text-muted-foreground">
          {language === 'en' 
            ? "Resources to help you succeed in tenders and procurement" 
            : "Rasilimali za kukusaidia kufanikiwa katika zabuni na ununuzi"}
        </p>
      </div>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={language === 'en' ? "Search resources..." : "Tafuta rasilimali..."}
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="guides" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {language === 'en' ? "Guides" : "Miongozo"}
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            {language === 'en' ? "Videos" : "Video"}
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {language === 'en' ? "Templates" : "Templeti"}
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {language === 'en' ? "Courses" : "Kozi"}
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          {searchQuery.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                {language === 'en' 
                  ? `Search results for "${searchQuery}" (${filteredResources.length})` 
                  : `Matokeo ya utafutaji wa "${searchQuery}" (${filteredResources.length})`}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map(resource => renderResourceCard(resource))}
          </div>
          
          {filteredResources.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {language === 'en' 
                  ? "No resources found matching your search" 
                  : "Hakuna rasilimali zilizopatikana zinazolingana na utafutaji wako"}
              </p>
            </div>
          )}
        </div>
      </Tabs>
      
      <div className="mt-12 border-t pt-8">
        <h2 className="text-xl font-semibold mb-4">
          {language === 'en' ? "Learning Achievements" : "Mafanikio ya Kujifunza"}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                {language === 'en' ? "Beginner Resources" : "Rasilimali za Mwanzo"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[75%]"></div>
                </div>
                <span className="text-sm font-medium">75%</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-amber-500" />
                {language === 'en' ? "Intermediate Resources" : "Rasilimali za Kati"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 w-[40%]"></div>
                </div>
                <span className="text-sm font-medium">40%</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                {language === 'en' ? "Advanced Resources" : "Rasilimali za Juu"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[15%]"></div>
                </div>
                <span className="text-sm font-medium">15%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LearningHub;
