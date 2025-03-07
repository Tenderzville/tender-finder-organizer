
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Gavel, Shield, FileText, Calculator, Search, Info, PlusCircle, Star } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { ProviderRating } from "@/components/providers/ProviderRating";
import { ChatSupport } from "@/components/ChatSupport";

const ServiceProviderCard = ({
  type,
  icon: Icon,
  isEmpty = true,
  providerId,
  language = "en"
}: {
  type: string;
  icon: React.ElementType;
  isEmpty?: boolean;
  providerId?: string;
  language?: "en" | "sw";
}) => {
  const [showRatings, setShowRatings] = useState(false);
  
  const t = {
    en: {
      noProviders: "No service providers available yet",
      registerAs: "Register as a Provider",
      viewRatings: "View Ratings",
      hideRatings: "Hide Ratings",
      findProviders: "Find qualified providers to assist with your tenders"
    },
    sw: {
      noProviders: "Hakuna watoa huduma wanaopatikana bado",
      registerAs: "Jiandikishe kama Mtoa Huduma",
      viewRatings: "Tazama Tathmini",
      hideRatings: "Ficha Tathmini",
      findProviders: "Pata watoa huduma wenye sifa kusaidia na zabuni zako"
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-primary" />
          {type}
        </CardTitle>
        <CardDescription>{t[language].findProviders}</CardDescription>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{t[language].noProviders}</p>
            <Button variant="outline" size="sm" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              {t[language].registerAs}
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">{type}</h3>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => setShowRatings(!showRatings)}
              >
                <Star className="h-4 w-4" />
                {showRatings ? t[language].hideRatings : t[language].viewRatings}
              </Button>
            </div>
            
            {showRatings && providerId && (
              <div className="mt-4">
                <ProviderRating providerId={providerId} language={language} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ServicesPage = () => {
  const [activeTab, setActiveTab] = useState("legal");
  const [language, setLanguage] = useState<"en" | "sw">("en");
  
  const t = {
    en: {
      title: "Tender Support Services",
      listServices: "List Your Services",
      alertDesc: "Connect with specialized service providers to help with your tender applications. All providers are independent entities and not directly affiliated with Tenders Ville.",
      searchPlaceholder: "Search for service providers...",
      legalTab: "Legal Services",
      financialTab: "Bid Bonds & Insurance",
      documentationTab: "Tender Writing",
      consultingTab: "BQ Experts",
      legalProviders: "Legal Service Providers",
      bidBondProviders: "Bid Bond & Insurance Providers",
      tenderWritingServices: "Tender Writing Services",
      bqExperts: "BQ and Technical Experts",
      allSpecialties: "All Specialties",
      contractLaw: "Contract Law",
      procurementLaw: "Procurement Law",
      disputeResolution: "Dispute Resolution",
      allTypes: "All Types",
      banks: "Banks",
      insurance: "Insurance Companies",
      microfinance: "Microfinance",
      allSectors: "All Sectors",
      construction: "Construction",
      ict: "ICT",
      medical: "Medical",
      general: "General",
      allExpertise: "All Expertise",
      architecture: "Architecture",
      engineering: "Engineering",
      quantitySurveying: "Quantity Surveying",
      language: "Language",
      english: "English",
      swahili: "Kiswahili"
    },
    sw: {
      title: "Huduma za Msaada wa Zabuni",
      listServices: "Orodhesha Huduma Zako",
      alertDesc: "Unganika na watoa huduma maalum kusaidia programu zako za zabuni. Watoa huduma wote ni mashirika huru na hayajaunganishwa moja kwa moja na Tenders Ville.",
      searchPlaceholder: "Tafuta watoa huduma...",
      legalTab: "Huduma za Kisheria",
      financialTab: "Dhamana & Bima",
      documentationTab: "Uandishi wa Zabuni",
      consultingTab: "Wataalam wa BQ",
      legalProviders: "Watoa Huduma za Kisheria",
      bidBondProviders: "Watoa Dhamana & Bima",
      tenderWritingServices: "Huduma za Uandishi wa Zabuni",
      bqExperts: "Wataalam wa BQ",
      allSpecialties: "Utaalam Wote",
      contractLaw: "Sheria ya Mikataba",
      procurementLaw: "Sheria ya Ununuzi",
      disputeResolution: "Utatuzi wa Migogoro",
      allTypes: "Aina Zote",
      banks: "Benki",
      insurance: "Kampuni za Bima",
      microfinance: "Mikopo Midogo",
      allSectors: "Sekta Zote",
      construction: "Ujenzi",
      ict: "TEHAMA",
      medical: "Matibabu",
      general: "Jumla",
      allExpertise: "Utaalam Wote",
      architecture: "Usanifu Majengo",
      engineering: "Uhandisi",
      quantitySurveying: "Upimaji Majengo",
      language: "Lugha",
      english: "Kiingereza",
      swahili: "Kiswahili"
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === "en" ? "sw" : "en");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t[language].title}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="language-toggle" 
                checked={language === "sw"}
                onCheckedChange={toggleLanguage}
              />
              <Label htmlFor="language-toggle">{t[language].language}</Label>
            </div>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              {t[language].listServices}
            </Button>
          </div>
        </div>
        
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            {t[language].alertDesc}
          </AlertDescription>
        </Alert>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t[language].searchPlaceholder} className="pl-10" />
            </div>
          </div>
          
          <Separator className="mb-6" />
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="legal" className="gap-2">
                <Gavel className="h-4 w-4" />
                {t[language].legalTab}
              </TabsTrigger>
              <TabsTrigger value="financial" className="gap-2">
                <Shield className="h-4 w-4" />
                {t[language].financialTab}
              </TabsTrigger>
              <TabsTrigger value="documentation" className="gap-2">
                <FileText className="h-4 w-4" />
                {t[language].documentationTab}
              </TabsTrigger>
              <TabsTrigger value="consulting" className="gap-2">
                <Calculator className="h-4 w-4" />
                {t[language].consultingTab}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="legal">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">{t[language].legalProviders}</h2>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t[language].allSpecialties} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t[language].allSpecialties}</SelectItem>
                        <SelectItem value="contract">{t[language].contractLaw}</SelectItem>
                        <SelectItem value="procurement">{t[language].procurementLaw}</SelectItem>
                        <SelectItem value="dispute">{t[language].disputeResolution}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <ServiceProviderCard 
                  type={t[language].legalTab}
                  icon={Gavel} 
                  providerId="sample-legal-1"
                  language={language}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="financial">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">{t[language].bidBondProviders}</h2>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t[language].allTypes} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t[language].allTypes}</SelectItem>
                        <SelectItem value="bank">{t[language].banks}</SelectItem>
                        <SelectItem value="insurance">{t[language].insurance}</SelectItem>
                        <SelectItem value="microfinance">{t[language].microfinance}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <ServiceProviderCard 
                  type={t[language].bidBondProviders} 
                  icon={Shield} 
                  providerId="sample-bond-1"
                  language={language}
                />
                <ServiceProviderCard 
                  type={t[language].insurance} 
                  icon={Shield} 
                  providerId="sample-insurance-1"
                  language={language}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="documentation">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">{t[language].tenderWritingServices}</h2>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t[language].allSectors} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t[language].allSectors}</SelectItem>
                        <SelectItem value="construction">{t[language].construction}</SelectItem>
                        <SelectItem value="ict">{t[language].ict}</SelectItem>
                        <SelectItem value="medical">{t[language].medical}</SelectItem>
                        <SelectItem value="general">{t[language].general}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <ServiceProviderCard 
                  type={t[language].tenderWritingServices} 
                  icon={FileText} 
                  providerId="sample-writing-1"
                  language={language}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="consulting">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">{t[language].bqExperts}</h2>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t[language].allExpertise} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t[language].allExpertise}</SelectItem>
                        <SelectItem value="architecture">{t[language].architecture}</SelectItem>
                        <SelectItem value="engineering">{t[language].engineering}</SelectItem>
                        <SelectItem value="quantity">{t[language].quantitySurveying}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <ServiceProviderCard 
                  type={t[language].bqExperts} 
                  icon={Calculator} 
                  providerId="sample-bq-1"
                  language={language}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
